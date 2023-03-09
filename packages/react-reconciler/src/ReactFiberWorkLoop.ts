import {ReactElement} from "shared/ReactTypes";
import {NormalSchedulerPriority, Scheduler} from "scheduler";
import {createFiberFromElement} from "./ReactFiber";
import {Fiber, FiberRoot} from "./ReactInternalTypes";
import {beginWork, updateNode} from "./ReactFiberBeginWork";
import {HostComponent, HostRoot, HostText} from "./ReactWorkTags";
import {ChildDeletion, Placement, Update} from "./ReactFiberFlags";

// current 当前的，在React中对应fiber，对应 output 的fiber
// work in progress  fiber 工作当中的、正在进行的，
let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null = null;

export function updateContainer(element: ReactElement, root: FiberRoot) {
  root.current.child = createFiberFromElement(element, root.current);
  // root.current.child.flags = Placement;

  scheduleUpdateOnFiber(root, root.current);
}

// React中的更新都会走 scheduleUpdateOnFiber， render\setState
export function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
  workInProgressRoot = root;
  workInProgress = fiber;

  Scheduler.scheduleCallback(NormalSchedulerPriority, workLoop);
}

function workLoop() {
  while (workInProgress) {
    performUnitOfWork(workInProgress);
  }

  if (!workInProgress && workInProgressRoot) {
    commitRoot();
  }
}

function performUnitOfWork(unitOfWork: Fiber): void {
  const current = unitOfWork.alternate;

  let next = beginWork(current, workInProgress); // 1.处理fiber 2.返回子节点
  if (next === null) {
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}

// 没有子节点->找兄弟->找叔叔
function completeUnitOfWork(unitOfWork: Fiber): void {
  let completeWork: Fiber = unitOfWork;

  do {
    const siblingFiber = completeWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }
    const returnFiber = completeWork.return;
    completeWork = returnFiber;
    workInProgress = completeWork;
  } while (completeWork);
}

// todo
function commitRoot() {
  workInProgressRoot.containerInfo.appendChild(
    workInProgressRoot.current.child.stateNode
  );

  // commitMutationEffects(root.current.child, root);

  // commit
  commitMutationEffectsOnFiber(
    workInProgressRoot.current.child,
    workInProgressRoot
  );

  workInProgressRoot = null;
  workInProgress = null;
}

// function commitMutationEffects(finishedWork: Fiber, root: FiberRoot) {
//   recursivelyTraverseMutationEffects(root, finishedWork);
//   commitReconciliationEffects(finishedWork);
// }

function commitMutationEffectsOnFiber(finishedWork: Fiber, root: FiberRoot) {
  recursivelyTraverseMutationEffects(root, finishedWork);
  commitReconciliationEffects(finishedWork);
}

function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber
) {
  let child: Fiber = parentFiber.child;
  while (child != null) {
    commitMutationEffectsOnFiber(child, root);
    child = child.sibling;
  }
}

function commitReconciliationEffects(finishedWork: Fiber) {
  const flags = finishedWork.flags;
  if (flags & Placement) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }

  if (flags & Update) {
    if (finishedWork.stateNode) {
      updateNode(
        finishedWork.stateNode,
        finishedWork.alternate.pendingProps,
        finishedWork.pendingProps
      );
    }

    finishedWork.flags &= ~Update;
  }

  // 在dom上删除，需要父子dom节点
  // 但是不是所有fiber节点都有dom
  if (flags & ChildDeletion) {
    // parentFiber 是 deletions 的父dom节点对应的fiber
    const parentFiber = isHostParent(finishedWork)
      ? finishedWork
      : getHostParentFiber(finishedWork);
    //
    const parent = parentFiber.stateNode;
    commitDeletions(finishedWork.deletions, parent);
    finishedWork.deletions = null;
    finishedWork.flags &= ~ChildDeletion;
  }
}

function commitDeletions(deletions: Array<Fiber>, parent: Element) {
  deletions.forEach((deletion) => {
    // 删除 deletion 对应的dom
    parent.removeChild(getStateNode(deletion));
  });
}

function getStateNode(fiber: Fiber) {
  let node = fiber;
  while (1) {
    if (isHostChild(node) && node.stateNode) {
      return node.stateNode;
    }
    node = node.child;
  }
}

// 新增插入、移动位置
// 更新
// child0->child1->child2->child3
// 寻找child0的dom节点的兄弟dom节点
function commitPlacement(finishedWork: Fiber) {
  // 获取父dom对应的fiber

  // 原生子节点
  if (finishedWork.stateNode && isHostChild(finishedWork)) {
    const parentFiber = getHostParentFiber(finishedWork);
    const parent = parentFiber.stateNode;

    const before = getHostSibling(finishedWork);
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
}

// 返回 fiber 的下一个在文档流里的兄弟dom节点
function getHostSibling(fiber: Fiber) {
  let node = fiber;

  sibling: while (1) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;

    while (!isHostChild(node)) {
      if (node.flags & Placement) {
        continue sibling;
      }

      if (node.child === null) {
        continue sibling;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
}

function insertOrAppendPlacementNode(
  node: Fiber,
  before: Element,
  parent: Element
) {
  const {stateNode} = node;
  if (before) {
    parent.insertBefore(stateNode, before);
  } else {
    parent.appendChild(stateNode);
  }
}

// 获取父dom对应的fiber
function getHostParentFiber(fiber: Fiber): Fiber {
  let parent = fiber.return;

  while (parent != null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
}

function isHostParent(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

function isHostChild(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostText;
}

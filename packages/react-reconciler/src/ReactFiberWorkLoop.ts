import {ReactElement} from "shared/ReactTypes";
import {NormalPriority, Scheduler} from "scheduler";
import {createFiberFromElement} from "./ReactFiber";
import {FiberRoot, Fiber} from "./ReactInternalTypes";
import {beginWork, updateNode} from "./ReactFiberBeginWork";
import {
  HostComponent,
  HostRoot,
  HostText,
  FunctionComponent,
} from "./ReactWorkTags";
import {Placement, Update} from "./ReactFiberFlags";
import {HookLayout, HookFlags, HookHasEffect} from "./ReactHookEffectTags";
import {create} from "../../../../../library/react/packages/react-native-renderer/src/ReactNativeAttributePayload";

// work in progress 正在工作当中的
// current
let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null = null;

export function updateContainer(element: ReactElement, root: FiberRoot) {
  root.current.child = createFiberFromElement(element, root.current);
  root.current.child.flags = Placement;
  scheduleUpdateOnFiber(root, root.current);
}

// !
export function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
  workInProgressRoot = root;
  workInProgress = fiber;

  Scheduler.scheduleCallback(NormalPriority, workLoop);
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }

  if (!workInProgress && workInProgressRoot) {
    commitRoot();
  }
}

// 1. 处理当前的fiber，就是workInProgress
// 2. 重新复制workInProgress
function performUnitOfWork(unitOfWork: Fiber) {
  //

  const current = unitOfWork.alternate;

  let next = beginWork(current, unitOfWork); // 1. 处理fiber 2. 返回子节点

  // next是子节点
  if (next === null) {
    // 没有子节点
    // 找兄弟、叔叔节点、爷爷的兄弟的节点等等
    completeUnitOfWork(unitOfWork);
  } else {
    // 有子节点
    workInProgress = next;
  }
}

// 没有子节点->找兄弟->找叔叔->找爷爷节点
function completeUnitOfWork(unitOfWork: Fiber) {
  let completeWork: Fiber = unitOfWork;

  do {
    const siblingFiber = completeWork.sibling;

    // 有兄弟节点
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }

    const returnFiber = completeWork.return;
    completeWork = returnFiber;
    workInProgress = completeWork;
  } while (completeWork);
}

function commitRoot() {
  commitMutationEffects(workInProgressRoot.current.child, workInProgressRoot);

  workInProgressRoot = null;
  workInProgress = null;
}

function commitMutationEffects(finishedWork: Fiber, root: FiberRoot) {
  recursivelyTraverseMutationEffects(root, finishedWork);
  commitReconciliationEffects(finishedWork);
}

function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber
) {
  let child = parentFiber.child;

  while (child !== null) {
    commitMutationEffects(child, root);
    child = child.sibling;
  }
}

// fiber.flags
// 新增插入、移动位置、更新属性、节点删除
function commitReconciliationEffects(finishedWork: Fiber) {
  const flags = finishedWork.flags;

  if (flags & Placement) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }

  if (flags & Update) {
    switch (finishedWork.tag) {
      case HostComponent:
        if (finishedWork.stateNode) {
          updateNode(
            finishedWork.stateNode,
            finishedWork.alternate.pendingProps,
            finishedWork.pendingProps
          );
        }
        break;

      case FunctionComponent:
        commitHookEffects(finishedWork, HookLayout | HookHasEffect);
    }

    finishedWork.flags &= ~Update;
  }

  if (finishedWork.deletions) {
    // parentFiber 是 deletions 的父dom节点对应的fiber
    const parentFiber = isHostParent(finishedWork)
      ? finishedWork
      : getHostParentFiber(finishedWork);
    const parent = parentFiber.stateNode;
    commitDeletions(finishedWork.deletions, parent);
    finishedWork.deletions = null;
  }
}

function commitHookEffects(finishedWork: Fiber, hookFlags: HookFlags) {
  const updateQueue = finishedWork.updateQueue;

  const lastEffect = updateQueue != null ? updateQueue.lastEffect : null;
  if (lastEffect) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;

    do {
      if ((effect.tag & hookFlags) === hookFlags) {
        const create = effect.create;
        effect.destory = create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
function commitDeletions(deletions: Array<Fiber>, parent: Element) {
  deletions.forEach((deletion) => {
    // 找到deletion的dom节点
    parent.removeChild(getStateNode(deletion));
  });
}

// 原生节点：原生标签、文本节点
function isHost(fiber: Fiber) {
  return fiber.tag === HostComponent || fiber.tag === HostText;
}

function getStateNode(fiber: Fiber) {
  let node = fiber;

  while (1) {
    if (isHost(node) && node.stateNode) {
      return node.stateNode;
    }
    node = node.child;
  }
}

// 在dom上，把子节点插入到父节点里
function commitPlacement(finishedWork: Fiber) {
  const parentFiber = getHostParentFiber(finishedWork);

  // 插入父dom
  if (
    finishedWork.stateNode &&
    (finishedWork.tag === HostText || finishedWork.tag === HostComponent)
  ) {
    // 获取父dom节点
    let parent = parentFiber.stateNode;

    if (parent.containerInfo) {
      parent = parent.containerInfo;
    }

    // dom节点
    const before = getHostSibling(finishedWork);
    insertOrAppendPlacementNode(finishedWork, before, parent);
    // parent.appendChild(finishedWork.stateNode);
  }
}

// 返回 fiber 的父dom节点对应的fiber
function getHostParentFiber(fiber: Fiber): Fiber {
  let parent = fiber.return;

  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
}

// 检查 fiber 是否可以是父 dom 节点
function isHostParent(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

// 返回fiber的下一个兄弟dom节点
// 不一定
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

    while (node.tag !== HostComponent && node.tag !== HostText) {
      if (node.flags & Placement) {
        // Placement表示节点是新增插入或者移动位置
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
// 新增插入 | 位置移动
// insertBefore | appendChild
function insertOrAppendPlacementNode(
  node: Fiber,
  before: Element,
  parent: Element
) {
  const {tag} = node;
  const isHost = tag === HostComponent || HostText;
  if (isHost) {
    const stateNode = node.stateNode;
    if (before) {
      parent.insertBefore(stateNode, before);
    } else {
      parent.appendChild(stateNode);
    }
  } else {
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

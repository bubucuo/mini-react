import {ReactElement} from "shared/ReactTypes";
import {NormalSchedulerPriority, Scheduler} from "scheduler";
import {createFiberFromElement} from "./ReactFiber";
import {Fiber, FiberRoot} from "./ReactInternalTypes";
import {beginWork, updateNode} from "./ReactFiberBeginWork";
import {HostComponent, HostRoot, HostText} from "./ReactWorkTags";
import {Placement, Update} from "./ReactFiberFlags";

// current 当前的，在React中对应fiber，对应 output 的fiber
// work in progress  fiber 工作当中的、正在进行的，
let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null = null;

export function updateContainer(element: ReactElement, root: FiberRoot) {
  root.current.child = createFiberFromElement(element, root.current);

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

  // commit
  commitMutationEffectsOnFiber(
    workInProgressRoot.current.child,
    workInProgressRoot
  );

  workInProgressRoot = null;
  workInProgress = null;
}

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

    finishedWork.flags &= ~Placement;
  }
}

// 新增插入、移动位置
// todo 函数组件、类组件这里需要修改
// 更新
function commitPlacement(finishedWork: Fiber) {
  // 获取父dom对应的fiber
  const parentFiber = getHostParentFiber(finishedWork);

  switch (parentFiber.tag) {
    case HostComponent:
      const parent = parentFiber.stateNode;
      if (
        (finishedWork.tag === HostComponent || finishedWork.tag === HostText) &&
        finishedWork.stateNode
      ) {
        parent.appendChild(finishedWork.stateNode);
      }
      break;
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

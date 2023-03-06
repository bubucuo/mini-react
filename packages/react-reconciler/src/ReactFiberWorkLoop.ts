import {ReactElement} from "shared/ReactTypes";
import {NormalPriority, Scheduler} from "scheduler";
import {createFiberFromElement} from "./ReactFiber";
import {FiberRoot, Fiber} from "./ReactInternalTypes";
import {beginWork, updateNode} from "./ReactFiberBeginWork";
import {HostComponent, HostRoot, HostText} from "./ReactWorkTags";
import {Placement, Update} from "./ReactFiberFlags";

// work in progress 正在工作当中的
// current
let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null = null;

export function updateContainer(element: ReactElement, root: FiberRoot) {
  root.current.child = createFiberFromElement(element, root.current);
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
  workInProgressRoot.containerInfo.appendChild(
    workInProgressRoot.current.child.stateNode
  );

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
// 新增插入、移动位置、更新属性
function commitReconciliationEffects(finishedWork: Fiber) {
  const flags = finishedWork.flags;

  if (flags & Placement) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }

  if (flags & Update) {
    if (finishedWork.stateNode && finishedWork.tag === HostComponent) {
      updateNode(
        finishedWork.stateNode,
        finishedWork.alternate.pendingProps,
        finishedWork.pendingProps
      );
    }

    finishedWork.flags &= ~Update;
  }
}

// 在dom上，把子节点插入到父节点里
function commitPlacement(finishedWork: Fiber) {
  const parentFiber = getHostParentFiber(finishedWork);

  // 获取父dom节点
  const parent = parentFiber.stateNode;

  // 插入父dom
  if (
    finishedWork.stateNode &&
    (finishedWork.tag === HostText || finishedWork.tag === HostComponent)
  ) {
    parent.appendChild(finishedWork.stateNode);
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

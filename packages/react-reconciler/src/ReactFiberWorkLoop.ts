import {ReactElement} from "shared/ReactTypes";
import {NormalSchedulerPriority, Scheduler} from "scheduler";
import {createFiberFromElement} from "./ReactFiber";
import {Fiber, FiberRoot} from "./ReactInternalTypes";
import {beginWork} from "./ReactFiberBeginWork";
import {HostComponent} from "./ReactWorkTags";
import {Placement} from "./ReactFiberFlags";

// current 当前的，在React中对应fiber，对应ouput的fiber
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
  switch (finishedWork.tag) {
    case HostComponent:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      return;
    // 函数组件、类组件等
  }
}

function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber
) {
  let child = parentFiber.child;
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
}

// 新增插入、移动位置
// todo 函数组件、类组件这里需要修改
function commitPlacement(finishedWork: Fiber) {
  const parentFiber = finishedWork.return;
  // todo
  // 父dom节点
  const parent = parentFiber.stateNode;
  console.log(
    "%c [ parent ]-115",
    "font-size:13px; background:pink; color:#bf2c9f;",
    parent,
    finishedWork,
    finishedWork.stateNode
  );
  if (finishedWork.stateNode) {
    parent.appendChild(finishedWork.stateNode);
  }
}

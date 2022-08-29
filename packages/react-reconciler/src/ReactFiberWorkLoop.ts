import {Placement, Update} from "./ReactFiberFlags";
import {
  updateClassComponent,
  updateFragmentComponent,
  updateFunctionComponent,
  updateHostComponent,
  updateHostTextComponent,
} from "./ReactFiberReconciler";
import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostText,
} from "./ReactWorkTags";
import {updateNode} from "./utils";
import {Fiber, FiberRoot} from "./ReactInternalTypes";
import {
  scheduleCallback as Scheduler_scheduleCallback,
  cancelCallback as Scheduler_cancelCallback,
  shouldYield,
  requestPaint,
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
} from "scheduler";
import {Lanes, Lane, NoTimestamp} from "./ReactFiberLane";
import {NoLanes} from "./ReactFiberLane";
import {getCurrentEventPriority} from "../../react-dom/client/ReactDOMHostConfig";

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
const RenderContext = /*                */ 0b010;
const CommitContext = /*                */ 0b100;

let executionContext: ExecutionContext = NoContext;
let workInProgress: Fiber | null = null; // work in progress 当前正在工作中的
let workInProgressRoot: FiberRoot | null = null;
let workInProgressRootRenderLanes: Lanes = NoLanes;
export let renderLanes: Lanes = NoLanes;

let currentEventTime: number = NoTimestamp;

export function getWorkInProgressRoot(): FiberRoot | null {
  return workInProgressRoot;
}

export function requestEventTime() {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    // We're inside React, so it's fine to read the actual time.
    return performance.now();
  }
  // We're not inside React, so we may be in the middle of a browser event.
  if (currentEventTime !== NoTimestamp) {
    // Use the same start time for all updates until we enter React again.
    return currentEventTime;
  }
  // This is the first update since React yielded. Compute a new start time.
  currentEventTime = performance.now();
  return currentEventTime;
}

export function requestUpdateLane(fiber: Fiber): Lane {
  const eventLane: Lane = getCurrentEventPriority();

  return eventLane;
}

// 初次渲染和更新
export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  lane: Lane,
  eventTime: number
) {
  workInProgress = fiber;
  workInProgressRoot = fiber;

  scheduleCallback(root, workLoop);
}

function scheduleCallback(priorityLevel, callback: Function) {
  return Scheduler_scheduleCallback(priorityLevel, callback);
}

//
function performUnitOfWork() {
  const {tag} = workInProgress;

  // todo 1. 更新当前组件
  switch (tag) {
    case HostComponent:
      updateHostComponent(workInProgress);
      break;

    case FunctionComponent:
      updateFunctionComponent(workInProgress);
      break;

    case ClassComponent:
      updateClassComponent(workInProgress);
      break;
    case Fragment:
      updateFragmentComponent(workInProgress);
      break;
    case HostText:
      updateHostTextComponent(workInProgress);
      break;
    default:
      break;
  }

  // todo 2. 下一个更新谁 深度优先遍历 （国王的故事）
  if (workInProgress.child) {
    workInProgress = workInProgress.child;
    return;
  }

  let next = workInProgress;

  while (next) {
    if (next.sibling) {
      workInProgress = next.sibling;
      return;
    }
    next = next.return;
  }

  workInProgress = null;
}

function workLoop() {
  while (workInProgress) {
    performUnitOfWork();
  }

  if (!workInProgress && workInProgressRoot) {
    commitRoot();
  }
}

// requestIdleCallback(workLoop);

// 提交
function commitRoot() {
  commitWorker(workInProgressRoot);
  workInProgressRoot = null;
}

function commitWorker(workInProgress) {
  if (!workInProgress) {
    return;
  }

  // 1. 提交自己
  // parentNode是父DOM节点

  const parentNode = getParentNode(workInProgress.return); /// workInProgress.return.stateNode;
  const {flags, stateNode} = workInProgress;
  if (flags & Placement && stateNode) {
    // 1
    // 0 1 2 3 4
    // 2 1 3 4
    const before = getHostSibling(workInProgress.sibling);
    insertOrAppendPlacementNode(stateNode, before, parentNode);
    // parentNode.appendChild(stateNode);
  }

  if (flags & Update && stateNode) {
    // 更新属性
    updateNode(stateNode, workInProgress.alternate.props, workInProgress.props);
  }

  if (workInProgress.deletions) {
    // 删除wip的子节点
    commitDeletions(workInProgress.deletions, stateNode || parentNode);
  }

  if (workInProgress.tag === FunctionComponent) {
    invokeHooks(workInProgress);
  }

  // 2. 提交子节点
  commitWorker(workInProgress.child);
  // 3. 提交兄弟
  commitWorker(workInProgress.sibling);
}

function getParentNode(workInProgress) {
  let tem = workInProgress;
  while (tem) {
    if (tem.stateNode) {
      return tem.stateNode;
    }
    tem = tem.return;
  }
}

function commitDeletions(deletions, parentNode) {
  for (let i = 0; i < deletions.length; i++) {
    parentNode.removeChild(getStateNode(deletions[i]));
  }
}

// 不是每个fiber都有dom节点
function getStateNode(fiber) {
  let tem = fiber;

  while (!tem.stateNode) {
    tem = tem.child;
  }

  return tem.stateNode;
}

function getHostSibling(sibling) {
  while (sibling) {
    if (sibling.stateNode && !(sibling.flags & Placement)) {
      return sibling.stateNode;
    }
    sibling = sibling.sibling;
  }
  return null;
}

function insertOrAppendPlacementNode(stateNode, before, parentNode) {
  if (before) {
    parentNode.insertBefore(stateNode, before);
  } else {
    parentNode.appendChild(stateNode);
  }
}

function invokeHooks(workInProgress) {
  const {updateQueueOfEffect, updateQueueOfLayout} = workInProgress;

  for (let i = 0; i < updateQueueOfLayout.length; i++) {
    const effect = updateQueueOfLayout[i];
    effect.create();
  }

  for (let i = 0; i < updateQueueOfEffect.length; i++) {
    const effect = updateQueueOfEffect[i];

    scheduleCallback(() => {
      effect.create();
    });
  }
}

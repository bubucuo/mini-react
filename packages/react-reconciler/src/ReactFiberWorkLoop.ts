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
import {
  Lanes,
  Lane,
  NoTimestamp,
  markRootUpdated,
  NoLane,
  getNextLanes,
  getHighestPriorityLane,
} from "./ReactFiberLane";
import {NoLanes, SyncLane} from "./ReactFiberLane";
import {getCurrentEventPriority} from "../../react-dom/client/ReactDOMHostConfig";
import {
  DiscreteEventPriority,
  lanesToEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
} from "./ReactEventPriorities";
import {createWorkInProgress} from "./ReactFiber";
import {beginWork} from "./ReactFiberBeginWork";

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
const RenderContext = /*                */ 0b010;
const CommitContext = /*                */ 0b100;

type RootExitStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const RootInProgress = 0;
const RootFatalErrored = 1;
const RootErrored = 2;
const RootSuspended = 3;
const RootSuspendedWithDelay = 4;
const RootCompleted = 5;
const RootDidNotComplete = 6;

let executionContext: ExecutionContext = NoContext;
let workInProgress: Fiber | null = null; // work in progress 当前正在工作中的
let workInProgressRoot: FiberRoot | null = null;
let workInProgressRootRenderLanes: Lanes = NoLanes;

let workInProgressRootExitStatus: RootExitStatus = RootInProgress;

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
  markRootUpdated(root, lane, eventTime);

  ensureRootIsScheduled(root, eventTime);
}

function ensureRootIsScheduled(root: FiberRoot, current: number) {
  const existingCallbackNode = root.callbackNode;

  const nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );

  if (nextLanes === NoLanes) {
    // Special case: There's nothing to work on.
    if (existingCallbackNode !== null) {
      Scheduler_cancelCallback(existingCallbackNode);
    }
    root.callbackNode = null;

    root.callbackPriority = NoLane;

    return;
  }

  // We use the highest priority lane to represent the priority of the callback.
  const newCallbackPriority = getHighestPriorityLane(nextLanes);
  // Check if there's an existing task. We may be able to reuse it.
  const existingCallbackPriority = root.callbackPriority;

  if (existingCallbackNode != null) {
    // Cancel the existing callback. We'll schedule a new one below.
    Scheduler_cancelCallback(existingCallbackNode);
  }

  // Schedule a new callback.

  // concurrent
  let schedulerPriorityLevel;
  switch (lanesToEventPriority(nextLanes)) {
    case DiscreteEventPriority:
      schedulerPriorityLevel = ImmediateSchedulerPriority;
      break;
    case ContinuousEventPriority:
      schedulerPriorityLevel = UserBlockingSchedulerPriority;
      break;
    case DefaultEventPriority:
      schedulerPriorityLevel = NormalSchedulerPriority;
      break;
    case IdleEventPriority:
      schedulerPriorityLevel = IdleSchedulerPriority;
      break;
    default:
      schedulerPriorityLevel = NormalSchedulerPriority;
      break;
  }

  let newCallbackNode = scheduleCallback(
    schedulerPriorityLevel,
    performConcurrentWorkOnRoot.bind(null, root)
  );

  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
}

function performConcurrentWorkOnRoot(root) {
  currentEventTime = NoTimestamp;

  const originalCallbackNode = root.callbackNode;

  // Determine the next lanes to work on, using the fields stored
  // on the root.
  let lanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );

  if (lanes === NoLanes) {
    // Defensive coding. This is never expected to happen.
    return null;
  }

  // We disable time-slicing in some cases: if the work has been CPU-bound
  // for too long ("expired" work, to prevent starvation), or we're in
  // sync-updates-by-default mode.

  const shouldTimeSlice = false;
  renderRootSync(root, lanes);

  ensureRootIsScheduled(root, performance.now());

  if (root.callbackNode === originalCallbackNode) {
    // The task node scheduled for this root is the same one that's
    // currently executed. Need to return a continuation.
    return performConcurrentWorkOnRoot.bind(null, root);
  }
  return null;
}

function renderRootSync(root: FiberRoot, lanes: Lanes) {
  const prevExecutionContext = executionContext;

  executionContext |= RenderContext;

  // const prevDispatcher = pushDispatcher();

  prepareFreshStack(root, lanes);

  do {
    workLoopSync();
    break;
  } while (true);
  executionContext = prevExecutionContext;

  // Set this to null to indicate there's no in-progress render.
  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;

  return workInProgressRootExitStatus;
}

function scheduleCallback(priorityLevel, callback: Function) {
  return Scheduler_scheduleCallback(priorityLevel, callback);
}

function workLoopSync() {
  // Already timed out, so perform work without checking if we need to yield.
  // while (workInProgress != null) {
  performUnitOfWork(workInProgress);
  // }
}

function prepareFreshStack(root: FiberRoot, lanes: Lanes): Fiber {
  root.finishedWork = null;
  root.finishedLanes = NoLanes;

  workInProgressRoot = root;
  const rootWorkInProgress = createWorkInProgress(root.current, null);
  workInProgress = rootWorkInProgress;
  workInProgressRootRenderLanes = renderLanes = lanes;
  workInProgressRootExitStatus = RootInProgress;

  return rootWorkInProgress;
}

function performUnitOfWork(unitOfWork: Fiber): void {
  const current = unitOfWork.alternate;

  let next = beginWork(current, unitOfWork, renderLanes);

  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next == null) {
    // If this doesn't spawn new work, complete the current work.
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }

  // ReactCurrentOwner.current = null;
}

function completeUnitOfWork(unitOfWork: Fiber): void {
  let completedWork = unitOfWork;

  workInProgress = null;
}

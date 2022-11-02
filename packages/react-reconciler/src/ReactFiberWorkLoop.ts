import {
  getHighestPriorityLane,
  getNextLanes,
  Lane,
  Lanes,
  markRootUpdated,
  NoLane,
  NoLanes,
  NoTimestamp,
} from "./ReactFiberLane";
import {Fiber, FiberRoot} from "./ReactInternalTypes";
import {Incomplete, NoFlags} from "./ReactFiberFlags";
import {beginWork} from "./ReactFiberBeginWork";
// import {getCurrentEventPriority} from "react-dom/client/ReactDOMHostConfig";
import {
  IdleSchedulerPriority,
  ImmediateSchedulerPriority,
  NormalSchedulerPriority,
  Scheduler,
  UserBlockingSchedulerPriority,
} from "scheduler";
import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  IdleEventPriority,
  lanesToEventPriority,
} from "./ReactEventPriorities";

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

type RootExitStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const RootInProgress = 0;
const RootFatalErrored = 1;
const RootErrored = 2;
const RootSuspended = 3;
const RootSuspendedWithDelay = 4;
const RootCompleted = 5;
const RootDidNotComplete = 6;

// Describes where we are in the React execution stack
let executionContext: ExecutionContext = NoContext;

// The root we're working on
let workInProgressRoot: FiberRoot | null = null;
// The fiber we're working on
let workInProgress: Fiber | null = null;
// The lanes we're rendering
let workInProgressRootRenderLanes: Lanes = NoLanes;

// If two updates are scheduled within the same event, we should treat their
// event times as simultaneous, even if the actual clock time has advanced
// between the first and second call.
let currentEventTime: number = NoTimestamp;

// A contextual version of workInProgressRootRenderLanes. It is a superset of
// the lanes that we started working on at the root. When we enter a subtree
// that is currently hidden, we add the lanes that would have committed if
// the hidden tree hadn't been deferred. This is modified by the
// HiddenContext module.
//
// Most things in the work loop should deal with workInProgressRootRenderLanes.
// Most things in begin/complete phases should deal with renderLanes.
export let renderLanes: Lanes = NoLanes;

// Whether to root completed, errored, suspended, etc.
let workInProgressRootExitStatus: RootExitStatus = RootInProgress;

// This is called by the HiddenContext module when we enter or leave a
// hidden subtree. The stack logic is managed there because that's the only
// place that ever modifies it. Which module it lives in doesn't matter for
// performance because this function will get inlined regardless
export function setRenderLanes(subtreeRenderLanes: Lanes) {
  renderLanes = subtreeRenderLanes;
}
export function getRenderLanes(): Lanes {
  return renderLanes;
}

export function requestUpdateLane(fiber: Fiber): Lane {
  // The opaque type returned by the host config is internally a lane, so we can
  // use that directly.
  // TODO: Move this type conversion to the event priority module.
  const eventLane: Lane = 16; // getCurrentEventPriority();
  return eventLane;
}

// 王朝的故事
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

  return null;
}

function completeUnitOfWork(unitOfWork: Fiber): void {
  // Attempt to complete the current unit of work, then move to the next
  // sibling. If there are no more siblings, return to the parent fiber.
  let completedWork: Fiber = unitOfWork;

  do {
    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;

    // Check if the work completed or if something threw.
    // if ((completedWork.flags & Incomplete) === NoFlags) {
    //   let next;

    //   next = completeWork(current, completedWork, renderLanes);
    //   if (next !== null) {
    //     // Completing this fiber spawned new work. Work on that next.
    //     workInProgress = next;
    //     return;
    //   }
    // }

    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      // If there is more work to do in this returnFiber, do that next.
      workInProgress = siblingFiber;
      return;
    }

    // Otherwise, return to the parent
    // $FlowFixMe[incompatible-type] we bail out when we get a null
    completedWork = returnFiber;
    // Update the next thing we're working on in case something throws.
    workInProgress = completedWork;
  } while (completedWork !== null);

  // We've reached the root.
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted;
  }
}

export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  lane: Lane,
  eventTime: number
) {
  // Mark that the root has a pending update.
  markRootUpdated(root, lane, eventTime);

  ensureRootIsScheduled(root, eventTime);
}

function ensureRootIsScheduled(root: FiberRoot, currentTime: number) {
  const existingCallbackNode = root.callbackNode;

  // Check if any lanes are being starved by other work. If so, mark them as
  // expired so we know to work on those next.
  // markStarvedLanesAsExpired(root, currentTime);

  // Determine the next lanes to work on, and their priority.
  const nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );

  if (nextLanes === NoLanes) {
    // Special case: There's nothing to work on.
    if (existingCallbackNode !== null) {
      Scheduler.cancelCallback(existingCallbackNode);
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
    Scheduler.cancelCallback(existingCallbackNode);
  }

  // Schedule a new callback.
  let newCallbackNode;

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

  newCallbackNode = Scheduler.scheduleCallback(
    schedulerPriorityLevel,
    performConcurrentWorkOnRoot.bind(null, root)
  );
}

function performConcurrentWorkOnRoot(root, didTimeout) {
  // Since we know we're in a React event, we can clear the current
  // event time. The next update will compute a new event time.
  currentEventTime = NoTimestamp;

  // Flush any pending passive effects before deciding which lanes to work on,
  // in case they schedule additional work.
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

  let exitStatus = renderRootSync(root, lanes);

  // We now have a consistent tree. The next step is either to commit it,
  // or, if something suspended, wait to commit it after a timeout.
  // root.finishedWork = finishedWork;
  // root.finishedLanes = lanes;
  // finishConcurrentRender(root, exitStatus, lanes);

  // if (root.callbackNode === originalCallbackNode) {
  //   // The task node scheduled for this root is the same one that's
  //   // currently executed. Need to return a continuation.
  //   return performConcurrentWorkOnRoot.bind(null, root);
  // }

  return null;
}

function renderRootSync(root: FiberRoot, lanes: Lanes) {
  const prevExecutionContext = executionContext;
  executionContext |= RenderContext;

  do {
    try {
      workLoopSync();
      break;
    } catch (thrownValue) {
      // handleThrow(root, thrownValue);
    }
  } while (true);

  executionContext = prevExecutionContext;

  // Set this to null to indicate there's no in-progress render.
  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;

  // It's safe to process the queue now that the render phase is complete.
  // finishQueueingConcurrentUpdates();

  return workInProgressRootExitStatus;
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

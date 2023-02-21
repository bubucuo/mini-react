import type {WorkTag} from "./ReactWorkTags";
import type {Flags} from "./ReactFiberFlags";
// import type {LaneMap, Lanes, Lane} from "../src-tem/ReactFiberLane";

export type Fiber = {
  // Tag identifying the type of fiber.
  tag: WorkTag;

  // Unique identifier of this child.
  key: null | string;

  // The value of element.type which is used to preserve the identity during
  // reconciliation of this child.
  elementType: any;

  // The resolved function/class/ associated with this fiber.
  type: any;

  // The local state associated with this fiber.
  stateNode: any;

  // Conceptual aliases
  // parent : Instance -> return The parent happens to be the same as the
  // return fiber since we've merged the fiber and instance.

  // Remaining fields belong to Fiber

  // The Fiber to return to after finishing processing this one.
  // This is effectively the parent, but there can be multiple parents (two)
  // so this is only the parent of the thing we're currently processing.
  // It is conceptually the same as the return address of a stack frame.
  return: Fiber | null;

  // Singly Linked List Tree Structure.
  child: Fiber | null;
  sibling: Fiber | null;
  index: number;

  // Input is the data coming into process this fiber. Arguments. Props.
  pendingProps: any; // This type will be more specific once we overload the tag.
  memoizedProps: any; // The props used to create the output.

  // A queue of state updates and callbacks.
  updateQueue: any;

  // The state used to create the output
  memoizedState: any;

  // Effect
  flags: Flags;
  subtreeFlags: Flags;
  deletions: Array<Fiber> | null;

  // Singly linked list fast path to the next fiber with side-effects.
  nextEffect: Fiber | null;

  // lanes: Lanes;
  // childLanes: Lanes;

  // This is a pooled version of a Fiber. Every fiber that gets updated will
  // eventually have a pair. There are cases when we can clean up pairs to save
  // memory if we need to.
  alternate: Fiber | null;
};

export type Container =
  | (Element & {_reactRootContainer?: FiberRoot})
  | (Document & {_reactRootContainer?: FiberRoot})
  | (DocumentFragment & {_reactRootContainer?: FiberRoot});

export type FiberRoot = {
  containerInfo: Container;
  current: Fiber;

  // A finished work-in-progress HostRoot that's ready to be committed.
  finishedWork: Fiber | null;

  // Timeout handle returned by setTimeout. Used to cancel a pending timeout, if
  // it's superseded by a new one.
  timeoutHandle: number;

  // Node returned by Scheduler.scheduleCallback. Represents the next rendering
  // task that the root will work on.
  callbackNode: any;
  // callbackPriority: Lane;
  // eventTimes: LaneMap<number>;
  // expirationTimes: LaneMap<number>;

  // pendingLanes: Lanes;
  // suspendedLanes: Lanes;
  // pingedLanes: Lanes;
  // expiredLanes: Lanes;

  // finishedLanes: Lanes;

  // entangledLanes: Lanes;
  // entanglements: LaneMap<Lanes>;
};

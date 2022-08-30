import {NoLane, NoLanes, createLaneMap, NoTimestamp} from "./ReactFiberLane";
import type {FiberRoot} from "./ReactInternalTypes";
import type {ReactNodeList} from "shared/ReactTypes";
import {createHostRootFiber} from "./ReactFiber";
import {initializeUpdateQueue} from "./ReactFiberClassUpdateQueue";

export type RootTag = 0 | 1;
// export const LegacyRoot = 0;
export const ConcurrentRoot = 1;

export function FiberRootNode(containerInfo, tag) {
  this.tag = tag;
  this.containerInfo = containerInfo;
  this.pendingChildren = null;
  this.current = null;
  this.finishedWork = null;
  this.callbackNode = null;
  this.callbackPriority = NoLane;

  this.eventTimes = createLaneMap(NoLanes);
  this.expirationTimes = createLaneMap(NoTimestamp);

  this.pendingLanes = NoLanes;
  this.finishedLanes = NoLanes;
}

export function createFiberRoot(containerInfo: any, tag: RootTag) {
  const root: FiberRoot = new FiberRootNode(containerInfo, tag);

  const uninitializedFiber = createHostRootFiber(tag);

  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  initializeUpdateQueue(uninitializedFiber);

  return root;
}

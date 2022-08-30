import type {WorkTag} from "./ReactWorkTags";

import type {Flags} from "./ReactFiberFlags";
import type {LaneMap, Lanes} from "./ReactFiberLane";
import type {Container} from "react-dom/client/ReactDOMHostConfig";
import {RootTag} from "./ReactFiberRoot";

export type Fiber = {
  tag: WorkTag;

  key: null | string;

  type: any;

  stateNode: any;

  return: Fiber | null;

  child: Fiber | null;
  sibling: Fiber | null;
  index: number;

  pendingProps: any;
  memoizedProps: any;

  updateQueue: any; // mixed

  memoizedState: any;

  flags: Flags;

  deletions: Array<Fiber> | null;

  lanes: Lanes;

  current: Fiber;
  alternate: Fiber | null;

  // todo
  props: any;
};

export type FiberRoot = {
  tag: RootTag;

  containerInfo: Container;
  current: Fiber;

  eventTimes: LaneMap<number>;

  pendingLanes: Lanes;
};

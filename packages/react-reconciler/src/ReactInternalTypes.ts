import type {WorkTag} from "./ReactWorkTags";

import type {Flags} from "./ReactFiberFlags";
import type {Lanes} from "./ReactFiberLane";

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

  alternate: Fiber | null;

  // todo
  props: any;
};

export type FiberRoot = {containerInfo: any};

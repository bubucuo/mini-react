import type {Fiber} from "./ReactInternalTypes";
import type {Lanes} from "./ReactFiberLane";
import {NoLanes} from "./ReactFiberLane";
import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostText,
} from "./ReactWorkTags";

import {
  updateClassComponent,
  updateFragmentComponent,
  updateFunctionComponent,
  updateHostComponent,
  updateHostTextComponent,
} from "./ReactFiberReconciler";

export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  workInProgress.lanes = NoLanes;

  switch (workInProgress.tag) {
    case HostComponent:
      return updateHostComponent(workInProgress);

    case FunctionComponent:
      return updateFunctionComponent(workInProgress);

    case ClassComponent:
      return updateClassComponent(workInProgress);
    case Fragment:
      return updateFragmentComponent(workInProgress);
    case HostText:
      return updateHostTextComponent(workInProgress);
  }
}

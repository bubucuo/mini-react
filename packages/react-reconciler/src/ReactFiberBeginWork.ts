import type {Fiber, FiberRoot} from "./ReactInternalTypes";
import type {Lanes} from "./ReactFiberLane";
import {NoLanes} from "./ReactFiberLane";
import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./ReactWorkTags";
import {RootState} from "./ReactFiberRoot";
// import {shouldSetTextContent} from "react-dom/client/ReactDOMHostConfig";
import {shouldSetTextContent} from "react-dom";

import {ContentReset} from "./ReactFiberFlags";
import {mountChildFibers, reconcileChildFibers} from "./ReactChildFiber";
// import {reconcileChildren} from "./ReactChildFiber";

// import {
//   updateClassComponent,
//   updateFragment,
//   updateFunctionComponent,
//   updateHostComponent,
//   updateHostTextComponent,
// } from "./ReactFiberReconciler";

let didReceiveUpdate: boolean = false;

export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  workInProgress.lanes = NoLanes;

  if (current !== null) {
    // 更新
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;
    if (oldProps !== newProps) {
      didReceiveUpdate = true;
    } else {
      // todo context value change
      didReceiveUpdate = false;
      // ?
      return attemptEarlyBailoutIfNoScheduledUpdate(
        current,
        workInProgress,
        renderLanes
      );
    }
  } else {
    // 初次渲染
    didReceiveUpdate = false;
  }

  // Before entering the begin phase, clear pending update priority.
  // TODO: This assumes that we're about to evaluate the component and process
  // the update queue. However, there's an exception: SimpleMemoComponent
  // sometimes bails out later in the begin phase. This indicates that we should
  // move this assignment out of the common path and into each branch.
  workInProgress.lanes = NoLanes;

  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);

    case FunctionComponent:
    // return updateFunctionComponent(current, workInProgress, renderLanes);

    case ClassComponent:
    // return updateClassComponent(current, workInProgress, renderLanes);

    case Fragment:
    // return updateFragment(current, workInProgress, renderLanes);

    case HostText:
      return updateHostText(current, workInProgress);
  }
}

function updateHostRoot(current, workInProgress, renderLanes) {
  // pushHostRootContext(workInProgress);

  const nextProps = workInProgress.pendingProps;
  const prevState = workInProgress.memoizedState;
  const prevChildren = prevState.element;

  // cloneUpdateQueue(current, workInProgress);
  // processUpdateQueue(workInProgress, nextProps, null, renderLanes);

  const nextState: RootState = workInProgress.memoizedState;
  const root: FiberRoot = workInProgress.stateNode;
  // pushRootTransition(workInProgress, root, renderLanes);

  const nextChildren = nextState.element;

  return workInProgress.child;
}

function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
) {
  // pushHostContext(workInProgress);

  const type = workInProgress.type;
  const nextProps = workInProgress.pendingProps;
  const prevProps = current !== null ? current.memoizedProps : null;

  let nextChildren = nextProps.children;
  const isDirectTextChild = shouldSetTextContent(type, nextProps);

  if (isDirectTextChild) {
    // We special case a direct text child of a host node. This is a common
    // case. We won't handle it as a reified child. We will instead handle
    // this in the host environment that also has access to this prop. That
    // avoids allocating another HostText fiber and traversing it.
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    // If we're switching from a direct text child to a normal child, or to
    // empty, we need to schedule the text content to be reset.
    workInProgress.flags |= ContentReset;
  }

  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

function updateHostText(current, workInProgress) {
  // Nothing to do here. This is terminal. We'll do the completion step
  // immediately after.
  return null;
}

export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes
) {
  if (current === null) {
    // If this is a fresh new component that hasn't been rendered yet, we
    // won't update its child set by applying minimal side-effects. Instead,
    // we will add them all to the child before it gets rendered. That means
    // we can optimize this reconciliation pass by not tracking side-effects.
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes
    );
  } else {
    // If the current child is the same as the work in progress, it means that
    // we haven't yet started any work on these children. Therefore, we use
    // the clone algorithm to create a copy of all the current children.

    // If we had any progressed work already, that is invalid at this point so
    // let's throw it out.
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes
    );
  }
}

export function updateFragment() {}

function attemptEarlyBailoutIfNoScheduledUpdate(
  current,
  workInProgress,
  renderLanes
): Fiber | null {
  return workInProgress.child;
}

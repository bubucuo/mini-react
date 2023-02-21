import {Fiber} from "./ReactInternalTypes";
import {HostComponent, HostRoot, HostText} from "../src/ReactWorkTags";
import {ContentReset, Flags, Placement} from "./ReactFiberFlags";
import {createFiberFromElement} from "./ReactFiber";
import {isStr} from "shared/utils";
import {FunctionComponent} from "./ReactWorkTags";

export function beginWork(current: Fiber | null, workInProgress: Fiber) {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress);
    case HostText:
      return updateHostText(current, workInProgress);
  }
}

function updateHostRoot(current: Fiber | null, workInProgress: Fiber) {
  return workInProgress.child;
}

function updateHostComponent(current: Fiber | null, workInProgress: Fiber) {
  const type = workInProgress.type;
  if (!workInProgress.stateNode) {
    workInProgress.stateNode = document.createElement(type);
    updateNode(workInProgress.stateNode, workInProgress.pendingProps);
  }
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

  workInProgress.child = reconcileChildren(
    current,
    workInProgress,
    nextChildren
  );
  return workInProgress.child;
}
function updateHostText(current, workInProgress) {
  // Nothing to do here. This is terminal. We'll do the completion step
  // immediately after.
  return null;
}

function updateFunctionComponent(current, workInProgress) {
  console.log(
    "%c [  ]-64",
    "font-size:13px; background:pink; color:#bf2c9f;",
    workInProgress
  );
  const {type, pendingProps} = workInProgress;

  const children = type(pendingProps);

  workInProgress.child = reconcileChildren(current, workInProgress, children);

  return workInProgress.child;
}

function shouldSetTextContent(type: string, props: any): boolean {
  return (
    type === "textarea" ||
    type === "noscript" ||
    typeof props.children === "string" ||
    typeof props.children === "number" ||
    (typeof props.dangerouslySetInnerHTML === "object" &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any
) {
  const newChildren = Array.isArray(nextChildren)
    ? nextChildren
    : [nextChildren];
  let newIdx = 0;
  let resultingFirstChild;
  let previousNewFiber = null; //记录上一次的fiber
  for (newIdx = 0; newIdx < newChildren.length; newIdx++) {
    const newChild = newChildren[newIdx];
    if (newChild == null) {
      continue;
    }
    const newFiber = createFiberFromElement(newChild, workInProgress);
    newFiber.flags = Placement;
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
  }

  return resultingFirstChild;
}

export function updateNode(node, nextVal) {
  Object.keys(nextVal).forEach((k) => {
    if (k === "children") {
      if (isStr(nextVal[k])) {
        node.textContent = nextVal[k] + "";
      }
    } else {
      node[k] = nextVal[k];
    }
  });
}

import {NoFlags} from "../src/ReactFiberFlags";
import {IndeterminateComponent, WorkTag} from "../src/ReactWorkTags";
import type {Fiber} from "../src/ReactInternalTypes";
import {REACT_FRAGMENT_TYPE} from "shared/ReactSymbols";

import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostText,
} from "../src/ReactWorkTags";

import {isFn, isStr} from "shared/utils";
import {ReactElement, ReactFragment} from "shared/ReactTypes";

export function createFiber(
  tag: WorkTag,
  pendingProps: any,
  key: null | string,
  returnFiber: Fiber
): Fiber {
  return new FiberNode(tag, pendingProps, key, returnFiber);
}

function FiberNode(
  tag: WorkTag,
  pendingProps: unknown,
  key: null | string,
  returnFiber: Fiber
) {
  // Instance
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null;

  // Fiber
  this.return = returnFiber; //null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;

  // Effects
  this.flags = NoFlags;
  this.subtreeFlags = NoFlags;
  this.deletions = null;

  this.alternate = null;
}

// This is used to create an alternate fiber to do work on.
export function createWorkInProgress(
  current: Fiber,
  pendingProps: any,
  returnFiber: Fiber
): Fiber {
  let workInProgress = current.alternate;

  if (workInProgress === null) {
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      returnFiber
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    workInProgress.alternate = current;

    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    // Needed because Blocks store data on type.
    workInProgress.type = current.type;

    // We already have an alternate.
    // Reset the effect tag.
    workInProgress.flags = NoFlags;

    // The effects are no longer valid.
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }

  // Reset all effects except static ones.
  // Static effects are not specific to a render.
  workInProgress.flags = current.flags;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;

  return workInProgress;
}

export function createFiberFromTypeAndProps(
  type: any,
  key: null | string,
  pendingProps: any,
  returnFiber: Fiber
): Fiber {
  let fiberTag: WorkTag = IndeterminateComponent;
  // The resolved type is set if we know what the final type will be. I.e. it's not lazy.
  if (isFn(type)) {
    if (shouldConstruct(type)) {
      fiberTag = ClassComponent;
    } else {
      fiberTag = FunctionComponent;
    }
  } else if (isStr(type)) {
    fiberTag = HostComponent;
  } else if (type === REACT_FRAGMENT_TYPE) {
    return createFiberFromFragment(pendingProps.children, key, returnFiber);
  }

  const fiber = createFiber(fiberTag, pendingProps, key, returnFiber);
  fiber.elementType = type;
  fiber.type = type;

  return fiber;
}

export function createFiberFromElement(
  element: ReactElement,
  returnFiber: Fiber
): Fiber {
  const type = element.type;
  const key = element.key;
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    returnFiber
  );
  return fiber;
}

export function createFiberFromFragment(
  elements: ReactFragment,
  key: null | string,
  returnFiber: Fiber
): Fiber {
  const fiber = createFiber(Fragment, elements, key, returnFiber);
  return fiber;
}

export function createFiberFromText(
  content: string,
  returnFiber: Fiber
): Fiber {
  const fiber = createFiber(HostText, content, null, returnFiber);
  return fiber;
}

function shouldConstruct(Component: Function) {
  const prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

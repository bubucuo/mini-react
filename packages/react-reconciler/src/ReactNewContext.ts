import {ReactContext} from "shared/ReactTypes";
import {Fiber} from "./ReactInternalTypes";

let currentlyRenderingFiber: Fiber = null;
let lastContextDependency = null;

export function prepareToReadContext(workInProgress: Fiber): void {
  currentlyRenderingFiber = workInProgress;
  lastContextDependency = null;

  const {dependencies} = workInProgress;
  if (dependencies) {
    if (dependencies.firstContext) {
      dependencies.firstContext = null;
    }
  }
}

export function pushProvider<T>(context: ReactContext<T>, nextValue: T): void {
  context._currentValue = nextValue;
}

export function readContext<T>(context: ReactContext<T>): T {
  const value = context._currentValue;

  const contextItem = {
    context,
    memoizedValue: value,
    next: null,
  };

  if (lastContextDependency) {
    lastContextDependency = lastContextDependency.next = contextItem;
  } else {
    // 第 0 个 context
    lastContextDependency = contextItem;
    currentlyRenderingFiber.dependencies = {firstContext: contextItem};
  }

  return value;
}

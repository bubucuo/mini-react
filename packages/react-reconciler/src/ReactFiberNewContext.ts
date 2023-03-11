import {createCursor, push, StackCursor} from "./ReactFiberStack";
import {Fiber} from "./ReactInternalTypes";
import {ReactContext} from "shared/ReactTypes";

const valueCursor: StackCursor<unknown> = createCursor(null);

let currentlyRenderingFiber: Fiber | null = null;
let lastContextDependency = null;

export function pushProvider<T>(context: ReactContext<T>, nextValue: T): void {
  push(valueCursor, context._currentValue);
  context._currentValue = nextValue;
}

// 读 context 之前的操作
export function prepareToReadContext(workInProgress: Fiber): void {
  // 初始化
  currentlyRenderingFiber = workInProgress;
  lastContextDependency = null;

  const dependencies = workInProgress.dependencies;
  if (dependencies !== null) {
    const firstContext = dependencies.firstContext;
    if (firstContext !== null) {
      dependencies.firstContext = null;
    }
  }
}

export function readContext<T>(context: ReactContext<T>) {
  const value = context._currentValue;

  const contextItem = {
    context,
    next: null,
    memoizedValue: value,
  };

  if (lastContextDependency) {
    lastContextDependency = lastContextDependency.next = contextItem;
  } else {
    // context 0
    lastContextDependency = contextItem;
    currentlyRenderingFiber.dependencies = {firstContext: contextItem};
  }

  return value;
}

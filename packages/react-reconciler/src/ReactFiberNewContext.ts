import {ReactContext} from "shared/ReactTypes";
import {createCursor, push, StackCursor} from "./ReactFiberStack";
import {Fiber} from "./ReactInternalTypes";

// stack： 受限的数据结构
// push: 只能在尾部 push
// read：只能在尾部 read
// pop： 只能在尾部 pop

const valueCursor: StackCursor<unknown> = createCursor(null);
let currentlyRenderingFiber: Fiber = null;
let lastContextDependency = null;

// set
// 把 context value 存起来
export function pushProvider<T>(context: ReactContext<T>, nextValue: T): void {
  push(valueCursor, context._currentValue);
  context._currentValue = nextValue;
}

export function prepareToReactContext(workInProgress: Fiber) {
  currentlyRenderingFiber = workInProgress;
  lastContextDependency = null;
  const dependencies = workInProgress.dependencies;
  if (dependencies) {
    const firstContext = dependencies.firstContext;
    if (firstContext !== null) {
      dependencies.firstContext = null;
    }
  }
}

// get
export function reactContext<T>(context: ReactContext<T>): T {
  const value = context._currentValue;

  const contextItem = {
    context,
    memoizedValue: value,
    next: null,
  };

  if (lastContextDependency) {
    lastContextDependency = lastContextDependency.next = contextItem;
  } else {
    // 这个第 0 个context
    lastContextDependency = contextItem;
    currentlyRenderingFiber.dependencies = {
      firstContext: contextItem,
    };
  }

  return value;
}

import {isFn} from "shared/utils";
import {requestEventTime, scheduleUpdateOnFiber} from "./ReactFiberWorkLoop";
import {Fiber, FiberRoot} from "./ReactInternalTypes";
import {HostRoot} from "./ReactWorkTags";
import {
  Flags,
  Passive as PassiveEffect,
  Update as UpdateEffect,
} from "./ReactFiberFlags";
import {HookFlags, HookLayout, HookPassive} from "./ReactHookEffectTags";
import {ReactContext} from "shared/ReactTypes";
import {readContext} from "./ReactFiberNewContext";
import {mergeLanes} from "./ReactFiberLane";

type Hook = {
  memoizedState: any; // useReducer| useState : state , Effect:
  next: Hook | null;
};

export type Effect = {
  tag: HookFlags;
  create: () => (() => void) | void;
  // destroy: (() => void) | void;
  deps: Array<unknown> | void | null;
  next: Effect;
};

let currentlyRenderingFiber: Fiber = null;
let workInProgressHook: Hook = null;
let currentHook: Hook = null;

// 函数组件执行的时候
export function renderHooks(workInProgress: Fiber) {
  currentlyRenderingFiber = workInProgress;
  currentlyRenderingFiber.updateQueue = null;
  workInProgressHook = null;
  currentHook = null;
}

// todo 获取当前hook
function updateWorkInProgressHook(): Hook {
  let hook: Hook;

  const current = currentlyRenderingFiber.alternate;

  if (current) {
    // 更新，复用老hook，在老的基础上更新
    currentlyRenderingFiber.memoizedState = current.memoizedState;

    if (workInProgressHook) {
      workInProgressHook = hook = workInProgressHook.next;
      currentHook = currentHook.next;
    } else {
      hook = workInProgressHook = currentlyRenderingFiber.memoizedState;
      currentHook = current.memoizedState;
    }
  } else {
    // 初次渲染，从0创建hook
    currentHook = null;
    hook = {
      memoizedState: null,
      next: null,
    };
    // 把hook挂到fiber上
    if (workInProgressHook) {
      workInProgressHook = workInProgressHook.next = hook;
    } else {
      // hook0
      workInProgressHook = currentlyRenderingFiber.memoizedState = hook;
    }
  }

  return hook;
}

export function useReducer(reducer: Function, initialState: any) {
  const hook = updateWorkInProgressHook();

  if (!currentlyRenderingFiber.alternate) {
    // 初次渲染
    hook.memoizedState = initialState;
  }
  const dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    hook,
    reducer
  );
  return [hook.memoizedState, dispatch];
}

function dispatchReducerAction(
  fiber: Fiber,
  hook: Hook,
  reducer: Function,
  action: any
) {
  hook.memoizedState = reducer ? reducer(hook.memoizedState, action) : action;

  const root = getRootForUpdatedFiber(fiber);

  const lane = 1; //requestUpdateLane(fiber);
  fiber.lanes = mergeLanes(fiber.lanes, lane);
  fiber.childLanes = mergeLanes(fiber.childLanes, lane);

  fiber.alternate = {...fiber};

  const eventTime = requestEventTime();

  scheduleUpdateOnFiber(root, fiber, lane, eventTime);
}

export function useState(initialState: any) {
  return useReducer(null, initialState);
}

// 根据 sourceFiber 找根节点
function getRootForUpdatedFiber(sourceFiber: Fiber): FiberRoot {
  let node = sourceFiber;
  let parent = node.return;

  while (parent !== null) {
    node = parent;
    parent = node.return;
  }

  return node.tag === HostRoot ? node.stateNode : null;
}

export function useEffect(
  create: () => (() => void) | null,
  deps: Array<unknown> | void | null
) {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

export function useLayoutEffect(
  create: () => (() => void) | null,
  deps: Array<unknown> | void | null
) {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
}

function updateEffectImpl(
  fiberFlags: Flags,
  hookFlags: HookFlags,
  create: () => (() => void) | null,
  deps: Array<unknown> | void | null
) {
  const hook = updateWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;

  if (currentHook) {
    // 更新阶段
    const prevEffect = currentHook.memoizedState;
    if (deps) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(deps, prevDeps)) {
        return;
      }
    }
  }

  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(hookFlags, create, deps);
}

// todo
function pushEffect(
  tag: HookFlags,
  create: () => (() => void) | null,
  deps: Array<unknown> | void | null
) {
  const effect: Effect = {tag, create, deps, next: null};

  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;

  if (componentUpdateQueue) {
    // 不是第 0 个effect
    const lastEffect = componentUpdateQueue.lastEffect;
    const firstEffect = lastEffect.next;
    lastEffect.next = effect;
    effect.next = firstEffect;
    componentUpdateQueue.lastEffect = effect;
  } else {
    // 第 0 个effect
    // 单向循环链表
    componentUpdateQueue = {lastEffect: null};
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  }

  return effect;
}

export function areHookInputsEqual(
  nextDeps: Array<unknown>,
  prevDeps: Array<unknown> | null
): boolean {
  if (prevDeps === null) {
    return false;
  }

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

export function useMemo<T>(
  nextCreate: () => T,
  deps: Array<unknown> | void | null
) {
  const hook = updateWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;

  const prevState = hook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1];
      if (areHookInputsEqual(nextDeps as any, prevDeps)) {
        return prevState[0];
      }
    }
  }

  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];

  return nextValue;
}

export function useCallback<T>(
  callback: T,
  deps: Array<unknown> | void | null
): T {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;

  const prevState = hook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<unknown> | null = prevState[1];
      if (areHookInputsEqual(nextDeps as any, prevDeps)) {
        return prevState[0];
      }
    }
  }

  hook.memoizedState = [callback, nextDeps];

  return callback;
}

// get context value
export function useContext<T>(context: ReactContext<T>): T {
  return readContext(context);
}

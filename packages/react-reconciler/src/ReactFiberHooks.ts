import {isFn} from "shared/utils";
import {
  Flags,
  Passive as PassiveEffect,
  Update as UpdateEffect,
} from "./ReactFiberFlags";
import {scheduleUpdateOnFiber} from "./ReactFiberWorkLoop";
import {
  HookFlags,
  HookHasEffect,
  HookLayout,
  HookPassive,
} from "./ReactHookEffectTags";
import {Fiber, FiberRoot} from "./ReactInternalTypes";
import {HostRoot} from "./ReactWorkTags";
import {ReactContext} from "../../shared/ReactTypes";
import {readContext} from "./ReactNewContext";

type Hook = {
  memoizedState: any; // state
  next: Hook | null; // 下一个hook
};

type Effect = {
  tag: HookFlags;
  create: () => (() => void) | void;
  deps: Array<unknown> | void | null;
  next: Effect | null;
};

let currentlyRenderingFiber: Fiber = null;
let workInProgressHook: Hook = null;
let currentHook: Hook = null;

// 获取当前正在执行的函数组件的fiber
export function renderHooks(workInProgress: Fiber) {
  currentlyRenderingFiber = workInProgress;
  currentlyRenderingFiber.updateQueue = null;
  workInProgressHook = null;
}

function updateWorkInProgressHook(): Hook {
  let hook: Hook;

  const current = currentlyRenderingFiber.alternate;
  if (current) {
    currentlyRenderingFiber.memoizedState = current.memoizedState;
    if (workInProgressHook) {
      workInProgressHook = hook = workInProgressHook.next;
      currentHook = currentHook.next;
    } else {
      hook = workInProgressHook = currentlyRenderingFiber.memoizedState;
      currentHook = current.memoizedState;
    }
    // 更新
  } else {
    // 初次渲染
    currentHook = null;
    hook = {
      memoizedState: null,
      next: null,
    };

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
    // 函数组件初次渲染
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

  fiber.alternate = {...fiber};

  scheduleUpdateOnFiber(root, fiber);
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

// initialState 函数 | state
export function useState(initialState: any) {
  return useReducer(null, isFn(initialState) ? initialState() : initialState);
}

export function useEffect(
  create: () => (() => void) | void,
  deps: Array<unknown> | void | null
) {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

export function useLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<unknown> | void | null
) {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
}

function updateEffectImpl(
  fiberFlags: Flags,
  hookFlags: HookFlags,
  create: () => (() => void) | void,
  deps: Array<unknown> | void | null
) {
  const hook = updateWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;

  if (currentHook) {
    // 检查deps的变化
    const prevEffect = currentHook.memoizedState;

    if (deps) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(deps, prevDeps)) {
        return;
      }
    }
  }

  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, nextDeps);
}

function pushEffect(
  tag: HookFlags,
  create: () => (() => void) | void,
  deps: Array<unknown> | void | null
) {
  const effect: Effect = {
    tag,
    create,
    deps,
    next: null,
  };

  // 单向循环链表
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;

  if (componentUpdateQueue === null) {
    // 第一个effect
    componentUpdateQueue = {lastEffect: null};
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    // 在原先的 effect 后面累加
    const lastEffect = componentUpdateQueue.lastEffect;
    const firstEffect = lastEffect.next;
    lastEffect.next = effect;
    effect.next = firstEffect;
    componentUpdateQueue.lastEffect = effect;
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
      const prevDeps = prevState[1];
      if (areHookInputsEqual(nextDeps as any, prevDeps)) {
        return prevState[0];
      }
    }
  }

  hook.memoizedState = [callback, nextDeps];
  return callback;
}

export function useRef<T>(initialValue: T): {current: T} {
  const hook = updateWorkInProgressHook();

  if (!currentHook) {
    const ref = {current: initialValue};
    hook.memoizedState = ref;
  }

  return hook.memoizedState;
}

export function useContext<T>(context: ReactContext<T>): T {
  return readContext(context);
}

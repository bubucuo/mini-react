import {isFn} from "shared/utils";
import {scheduleUpdateOnFiber} from "./ReactFiberWorkLoop";
import {Fiber, FiberRoot} from "./ReactInternalTypes";
import {HostRoot} from "./ReactWorkTags";

type Hook = {
  memorizedState: any; // useReducer| useState : state
  next: Hook | null;
};

let currentlyRenderingFiber: Fiber = null;
let workInProgressHook: Hook = null;

// 函数组件执行的时候
export function renderHooks(workInProgress: Fiber) {
  currentlyRenderingFiber = workInProgress;
  workInProgressHook = null;
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
    } else {
      hook = workInProgressHook = currentlyRenderingFiber.memoizedState;
    }
  } else {
    // 初次渲染，从0创建hook
    hook = {
      memorizedState: null,
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
    hook.memorizedState = initialState;
  }
  const dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    hook,
    reducer
  );
  return [hook.memorizedState, dispatch];
}

function dispatchReducerAction(
  fiber: Fiber,
  hook: Hook,
  reducer: any,
  action: any
) {
  // 兼容了 useReducer 和 useState
  hook.memorizedState = reducer
    ? reducer(hook.memorizedState, action)
    : isFn(action)
    ? action()
    : action;
  const root = getRootForUpdatedFiber(fiber);
  fiber.alternate = {...fiber};
  // 当前函数组件的fiber
  scheduleUpdateOnFiber(root, fiber);
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

import {scheduleUpdateOnFiber} from "./ReactFiberWorkLoop";

// 当前正在渲染的fiber
let currentlyRenderingFiber = null;
let workInProgressHook = null;

export function renderWithHooks(wip) {
  currentlyRenderingFiber = wip;
  currentlyRenderingFiber.memoizedState = null; // 第0个hook 头结点
  workInProgressHook = null;
}

function updateWorkInProgressHook() {
  let hook;
  // todo
  // 判断初次渲染还是更新
  const current = currentlyRenderingFiber.alternate;
  if (current) {
    // 更新阶段
    // 在老的hook进行更新
    // 从老的fiber上找到hook更新到新的fiber上
    currentlyRenderingFiber.memoizedState = current.memoizedState;
    if (workInProgressHook) {
      // 不是第0个hook
      hook = workInProgressHook = workInProgressHook.next;
    } else {
      // 第0个hook
      hook = workInProgressHook = current.memoizedState;
    }
  } else {
    // 初次渲染
    hook = {
      memoizedState: null,
      next: null,
    };

    if (workInProgressHook) {
      // 不是第0个hook
      workInProgressHook = workInProgressHook.next = hook;
    } else {
      // 第0个hook
      workInProgressHook = currentlyRenderingFiber.memoizedState = hook;
    }
  }

  return hook;
}

export function useReducer(reducer, initalState) {
  const hook = updateWorkInProgressHook();
  // 初次渲染
  if (!currentlyRenderingFiber.alternate) {
    hook.memoizedState = initalState;
  }

  const dispatch = (action) => {
    // 计算状态值
    hook.memoizedState = reducer(hook.memoizedState, action);
    scheduleUpdateOnFiber(currentlyRenderingFiber);
  };
  // todo
  return [hook.memoizedState, dispatch];
}

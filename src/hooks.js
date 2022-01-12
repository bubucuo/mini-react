let currentlyRenderingFiber = null;
let workInProgressHook = null;

export function renderWithHooks(wip) {
  currentlyRenderingFiber = wip;
  currentlyRenderingFiber.memorizedState = null;
  workInProgressHook = null;
}

// 获取当前hook
function updateWorkInProgressHook() {
  let hook;
  const current = currentlyRenderingFiber.alternate;

  if (current) {
    // 更新
    currentlyRenderingFiber.memorizedState = current.memorizedState;

    if (workInProgressHook) {
      workInProgressHook = hook = workInProgressHook.next;
    } else {
      // hook0
      workInProgressHook = hook = currentlyRenderingFiber.memorizedState;
    }
  } else {
    // 初次渲染
    hook = {
      memorizedState: null, // state
      next: null, // 下一个hook
    };

    if (workInProgressHook) {
      workInProgressHook = workInProgressHook.next = hook;
    } else {
      // hook0
      workInProgressHook = currentlyRenderingFiber.memorizedState = hook;
    }
  }

  return hook;
}

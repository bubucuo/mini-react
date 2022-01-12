import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

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

export function useReducer(reducer, initalState) {
  const hook = updateWorkInProgressHook();

  if (!currentlyRenderingFiber.alternate) {
    // 初次渲染
    hook.memorizedState = initalState;
  }

  // const dispatch = () => {
  //   console.log("currentlyRenderingFiber", currentlyRenderingFiber); //sy-log
  //   hook.memorizedState = reducer(hook.memorizedState);
  //   currentlyRenderingFiber.alternate = { ...currentlyRenderingFiber };
  //   scheduleUpdateOnFiber(currentlyRenderingFiber);
  // };

  const dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    hook,
    reducer
  );

  return [hook.memorizedState, dispatch];
}

function dispatchReducerAction(fiber, hook, reducer) {
  hook.memorizedState = reducer(hook.memorizedState);
  fiber.alternate = { ...fiber };
  fiber.sibling = null;
  scheduleUpdateOnFiber(fiber);
}

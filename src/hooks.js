import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

let currentlyRenderingFiber = null;
let workInProgressHook = null;

export function renderWithHooks(wip) {
  currentlyRenderingFiber = wip;
  currentlyRenderingFiber.memorizedState = null;
  workInProgressHook = null;
}

function updateWorkInProgressHook() {
  let hook;

  const current = currentlyRenderingFiber.alternate;
  // todo
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
      memorizedState: null,
      next: null,
    };

    if (workInProgressHook) {
      workInProgressHook = workInProgressHook.next = hook;
    } else {
      workInProgressHook = currentlyRenderingFiber.memorizedState = hook;
    }
  }

  return hook;
}

// hook {
// memorizedState: 状态值
// }
export function useReducer(reducer, initalState) {
  const hook = updateWorkInProgressHook();

  if (!currentlyRenderingFiber.alternate) {
    // 初次渲染
    hook.memorizedState = initalState;
  }

  const dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    hook,
    reducer
  );
  //   const dispatch = () => {
  //     hook.memorizedState = reducer(hook.memorizedState);
  //     currentlyRenderingFiber.alternate = { ...currentlyRenderingFiber };
  //     currentlyRenderingFiber.sibling = null;
  //     scheduleUpdateOnFiber(currentlyRenderingFiber);
  //   };
  // todo
  return [hook.memorizedState, dispatch];
}

function dispatchReducerAction(fiber, hook, reducer) {
  hook.memorizedState = reducer(hook.memorizedState);
  fiber.alternate = { ...fiber };
  fiber.sibling = null;
  scheduleUpdateOnFiber(fiber);
}

import {push, pop, peek} from "./SchedulerMinHeap";
import {getCurrentTime, isFn, isObject} from "shared/utils";
import {
  getTimeoutByPriorityLevel,
  NormalPriority,
  PriorityLevel,
} from "./SchedulerPriorities";

type Callback = any; // (args: any) => void | any;

export interface Task {
  id: number;
  callback: Callback;
  priorityLevel: PriorityLevel;
  startTime: number;
  expirationTime: number;
  sortIndex: number;
}

type HostCallback = (hasTimeRemaining: boolean, currentTime: number) => boolean;

// 任务存储，最小堆
const taskQueue: Array<Task> = [];
const timerQueue: Array<Task> = [];

let taskIdCounter: number = 1;

let currentTask: Task | null = null;
let currentPriorityLevel: PriorityLevel = NormalPriority;

// 在计时
let isHostTimeoutScheduled: boolean = false;

// 在调度任务
let isHostCallbackScheduled = false;
// This is set while performing work, to prevent re-entrance.
let isPerformingWork = false;

let schedulePerformWorkUntilDeadline: Function;

let isMessageLoopRunning = false;
let scheduledHostCallback: HostCallback | null = null;
let taskTimeoutID: number = -1;

let startTime = -1;

let needsPaint = false;

// Scheduler periodically yields in case there is other work on the main
// thread, like user events. By default, it yields multiple times per frame.
// It does not attempt to align with frame boundaries, since most tasks don't
// need to be frame aligned; for those that do, use requestAnimationFrame.
let frameInterval = 5; //frameYieldMs;

function cancelHostTimeout() {
  clearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
}

function requestHostTimeout(callback: Callback, ms: number) {
  taskTimeoutID = setTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}

// 检查timerQueue中的任务，是否有任务到期了呢，到期了就把当前有效任务移动到taskQueue
function advanceTimers(currentTime: number) {
  let timer: Task = peek(timerQueue) as Task;
  while (timer !== null) {
    if (timer.callback === null) {
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    } else {
      return;
    }
    timer = peek(timerQueue) as Task;
  }
}

// 倒计时到点了
function handleTimeout(currentTime: number) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);

  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      const firstTimer: Task = peek(timerQueue) as Task;
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

// todo
function requestHostCallback(callback: Callback) {
  scheduledHostCallback = callback;

  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();

    // Keep track of the start time so we can measure how long the main thread
    // has been blocked.
    startTime = currentTime;

    const hasTimeRemaining = true;
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      }
    }
  } else {
    isMessageLoopRunning = false;
  }
};

const channel = new MessageChannel();

const port = channel.port2;

channel.port1.onmessage = performWorkUntilDeadline;

schedulePerformWorkUntilDeadline = () => {
  port.postMessage(null);
};

function flushWork(hasTimeRemaining: boolean, initialTime: number) {
  isHostCallbackScheduled = false;

  if (isHostTimeoutScheduled) {
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }

  isPerformingWork = true;

  let previousPriorityLevel = currentPriorityLevel;
  try {
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}

// 在当前时间切片内循环执行任务
function workLoop(hasTimeRemaining: boolean, initialTime: number) {
  let currentTime = initialTime;

  advanceTimers(currentTime);
  currentTask = peek(taskQueue) as Task;

  while (currentTask !== null) {
    const should = shouldYieldToHost();
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || should)
    ) {
      // 当前任务还没有过期，并且没有剩余时间了
      break;
    }

    const callback = currentTask.callback;
    currentPriorityLevel = currentTask.priorityLevel;
    if (isFn(callback)) {
      currentTask.callback = null;

      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;

      const continuationCallback = callback(didUserCallbackTimeout);

      currentTime = getCurrentTime();
      if (isFn(continuationCallback)) {
        // 任务没有执行完
        currentTask.callback = continuationCallback;
        advanceTimers(currentTime);
        return true;
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    } else {
      // currentTask不是有效任务
      pop(taskQueue);
    }
    currentTask = peek(taskQueue) as Task;
  }

  // 判断还有没有其他的任务
  if (currentTask !== null) {
    return true;
  } else {
    const firstTimer = peek(timerQueue) as Task;
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}

function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;

  if (timeElapsed < frameInterval) {
    // The main thread has only been blocked for a really short amount of time;
    // smaller than a single frame. Don't yield yet.
    return false;
  }

  return true;
}

export function scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: {delay: number}
) {
  //任务进入调度器的时间
  const currentTime = getCurrentTime();
  let startTime: number;

  if (isObject(options) && options !== null) {
    let delay = options?.delay;
    if (typeof delay === "number" && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  const timeout = getTimeoutByPriorityLevel(priorityLevel);
  const expirationTime = startTime + timeout;

  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime, //任务开始调度的理论时间
    expirationTime, //过期时间
    sortIndex: -1,
  };

  if (startTime > currentTime) {
    // 有延迟的任务
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      //
      if (isHostTimeoutScheduled) {
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);

    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }
}

// 取消任务
export function cancelCallback(task: Task) {
  // Null out the callback to indicate the task has been canceled. (Can't
  // remove from the queue because you can't remove arbitrary nodes from an
  // array based heap, only the first one.)
  // 取消任务，不能直接删除，因为最小堆中只能删除堆顶元素
  task.callback = null;
}

// 获取当前任务优先级
export function getCurrentPriorityLevel(): PriorityLevel {
  return currentPriorityLevel;
}

export function requestPaint() {
  // if (
  //   enableIsInputPending &&
  //   navigator !== undefined &&
  //   // $FlowFixMe[prop-missing]
  //   navigator.scheduling !== undefined &&
  //   // $FlowFixMe[incompatible-type]
  //   navigator.scheduling.isInputPending !== undefined
  // ) {
  //   needsPaint = true;
  // }
  // Since we yield every frame regardless, `requestPaint` has no effect.
}

// heap中谁的任务优先级最高先去执行谁，这里说的“任务优先级”不是priorityLevel

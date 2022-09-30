import {push, pop, peek} from "./SchedulerMinHeap";
import {getCurrentTime, isFn, isObject} from "./shared";
import {getTimeoutByPriorityLevel, NormalPriority} from "./SchedulerPriorities";

type Callback = any; // (args: any) => void | any;

export interface Task {
  id: number;
  callback: Callback;
  priorityLevel: number;
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
let currentPriorityLevel = NormalPriority;

// 在计时
let isHostTimeoutScheduled: boolean = false;

// 在调度任务
let isHostCallbackScheduled = false;

let isMessageLoopRunning = false;
let scheduledHostCallback: HostCallback | null = null;
let taskTimeoutID: number = -1;

let startTime = -1;

let needsPaint = false;
let frameInterval = 5; //frameYieldMs;

function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    // The main thread has only been blocked for a really short amount of time;
    // smaller than a single frame. Don't yield yet.
    return false;
  }

  return true;
}

let schedulePerformWorkUntilDeadline: Function;

// This is set while performing work, to prevent re-entrance.
let isPerformingWork = false;

const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    startTime = currentTime;
    const hasTimeRemaining = true;

    // If a scheduler task throws, exit the current browser task so the
    // error can be observed.
    //
    // Intentionally not using a try-catch, since that makes some debugging
    // techniques harder. Instead, if `scheduledHostCallback` errors, then
    // `hasMoreWork` will remain true, and we'll continue the work loop.
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        // If there's more work, schedule the next message event at the end
        // of the preceding one.
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      }
    }
  } else {
    isMessageLoopRunning = false;
  }

  // Yielding to the browser will give it a chance to paint, so we can
  // reset this.
  needsPaint = false;
};

const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

schedulePerformWorkUntilDeadline = () => {
  port.postMessage(null);
};

// 取消定时
function cancelHostTimeout() {
  clearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
}

function requestHostTimeout(callback: Callback, ms: number) {
  taskTimeoutID = setTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}

// 检查 timerQueue 中的任务，是否有任务已经到期了呢，如果是，就移动到 taskQueue 中
function advanceTimers(currentTime: number) {
  let timer: Task = peek(timerQueue) as Task;
  while (timer !== null) {
    if (timer.callback === null) {
      // 没有callback了，证明任务已被取消，那么从 timerQueue 删除这个任务即可
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // 任务已经到期，把它移动到 taskQueue 吧
      pop(timerQueue);
      // taskQueue 中是用 expirationTime 作为sortIndex排序的，更新一下呀
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    } else {
      // 因为 timerQueue 是最小堆结构，如果这个timer没有过时，那么后面的也没有过时
      return;
    }
    timer = peek(timerQueue) as Task;
  }
}

//
function handleTimeout(currentTime: number) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);

  // 单线程，每次只能调度一个任务，因此如果现在没有任务在被调度，那么可以开始了
  if (!isHostCallbackScheduled) {
    // 有任务
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      // 没有任务可以调度，那就去处理 timerQueue 中的优先级最高的任务
      const firstTimer = peek(timerQueue) as Task;
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

function requestHostCallback(callback: HostCallback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

function flushWork(hasTimeRemaining: boolean, initialTime: number) {
  isHostCallbackScheduled = false;

  if (isHostTimeoutScheduled) {
    // We scheduled a timeout but it's no longer needed. Cancel it.
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }

  isPerformingWork = true;

  const previousPriorityLevel = currentPriorityLevel;

  try {
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}

function workLoop(hasTimeRemaining: boolean, initialTime: number) {
  let currentTime = initialTime;
  advanceTimers(currentTime);
  currentTask = peek(taskQueue) as Task;

  while (currentTask !== null) {
    if (
      currentTask.expirationTime > currentTime &&
      !(hasTimeRemaining || shouldYieldToHost())
    ) {
      // This currentTask hasn't expired, and we've reached the deadline.
      //  当前任务还没有过期
      break;
    }
    const callback = currentTask.callback;
    if (isFn(callback)) {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;

      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      if (isFn(continuationCallback)) {
        currentTask.callback = continuationCallback;
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
      }
      advanceTimers(currentTime);
    } else {
      pop(taskQueue);
    }

    currentTask = peek(taskQueue) as Task;
  }

  // Return whether there's additional work
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

export function scheduleCallback(
  priorityLevel: number,
  callback: Function,
  options?: {delay: number}
) {
  let currentTime = getCurrentTime();
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

  let timeout = getTimeoutByPriorityLevel(priorityLevel);

  let expirationTime = startTime + timeout;

  const newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };

  if (startTime > currentTime) {
    // This is a delayed task.
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      // 如果现在taskQueue为空，而newTask又是timerQueue中优先级最高的任务
      // 那么（否则就在 timerQueue 中待着吧）
      if (isHostTimeoutScheduled) {
        // 如果现在有别的任务在做计时，那么取消它。先安排优先级高的
        // Cancel an existing timeout.
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      // Schedule a timeout.
      // 现在安排当前的任务用setTimeout做计时，即startTime - currentTime 之后执行
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

  return newTask;
}

import {
  enableSchedulerDebugging,
  enableProfiling,
  enableIsInputPending,
  enableIsInputPendingContinuous,
  frameYieldMs,
  continuousYieldMs,
  maxYieldMs,
} from "./SchedulerFeatureFlags";
import type {Heap} from "./SchedulerMinHeap";
import {push, pop, peek} from "./SchedulerMinHeap";
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from "./SchedulerPriorities";

const getCurrentTime = () => performance.now();

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var maxSigned31BitInt = 1073741823;

// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

// 任务存储在最小堆中
var taskQueue: Heap = [];
var timerQueue: Heap = [];

// 任务的id自增函数，可以记录插入任务的顺序
var taskIdCounter = 1;

var currentTask = null;
var currentPriorityLevel = NormalPriority;

// 任务执行的时候为true，防止任务重复进入
var isPerformingWork = false;

var isHostCallbackScheduled = false;
var isHostTimeoutScheduled = false;

const isInputPending = navigator.scheduling.isInputPending.bind(
  navigator.scheduling
);

function advanceTimers(currentTime: Date) {
  // 检查timerQueue中不在延期的任务，病把他们加入taskQueue中
  let timer = peek(timerQueue);

  while (timer !== null) {
    if (timer.callback === null) {
      //Timer被取消
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // 被触发，加入taskQueue
      pop(timerQueue);

      timer.sortIndex = timer.expirationTime;

      push(taskQueue, timer);
    } else {
      return;
    }

    timer = peek(timerQueue);
  }
}

function handleTimeout(currentTime: Date) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);

  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) != null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      const firstTimer = peek(timerQueue);

      if (firstTimer != null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

function flushWork(hasTimeRemaining: boolean, initialTime: number) {
  isHostCallbackScheduled = false;

  if (isHostTimeoutScheduled) {
    isHostTimeoutScheduled = false;
    // 之前计划了一个时间延迟，但是现在不需要了，取消即可
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

  currentTask = peek(taskQueue);

  while (currentTask !== null) {
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      // 任务还没执行完成，但是已经没时间了
      break;
    }
    const callback = currentTask.callback;

    if (typeof callback === "function") {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();

      if (typeof continuationCallback === "function") {
        currentTask.callback = continuationCallback;
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }

  if (currentTask != null) {
    // 还有任务
    return true;
  } else {
    const firstTimer = peek(timerQueue);

    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}

function scheduleCallback(
  priorityLevel: number,
  callback: Function,
  options?: any
) {
  var currentTime = getCurrentTime();
  var startTime;

  if (typeof options === "object" && options !== null) {
    var delay = options.delay;
    if (typeof delay === "number" && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  var timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }

  var expirationTime = startTime + timeout;
  var newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };

  if (startTime > currentTime) {
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      if (isHostTimeoutScheduled) {
        // 所有任务都延时了
        cancelHostTimeout();
      } else {
        isHostCallbackScheduled = true;
      }

      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);

    // 调度一个callback。
    // 如果此时正在执行任务，则等待下次让步
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }

  return newTask;
}

function cancelCallback(task) {
  task.callback = null;
}

let isMessageLoopRunning = false;
let scheduledHostCallback;
let taskTimeoutID = -1;

// 调度器会周期地让步，以防主线程有其他任务要执行，比如用户事件。
// 默认情况下，每帧会让步多次。
// 由于大多数的任务并不需要帧对齐，因此这里并不会尝试与帧同步。
// 对于需要的帧对齐的任务，会用requestAnimationFrame。
let frameInterval = frameYieldMs;
const continuousInputInterval = continuousYieldMs;
const maxInterval = maxYieldMs;
let startTime = -1;

let needsPaint = false;

// 判断是否超时，是否需要被打断
function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    // The main thread has only been blocked for a really short amount of time;
    // smaller than a single frame. Don't yield yet.
    return false;
  }

  return true;
}

function requestPaint() {
  if (
    enableIsInputPending &&
    navigator !== undefined &&
    navigator.scheduling !== undefined &&
    navigator.scheduling.isInputPending !== undefined
  ) {
    needsPaint = true;
  }
}

function requestYield() {
  // 让步
  startTime = -9999;
}

const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    // 追踪开始时间，这样可以计算主线程被堵住多久了
    startTime = currentTime;
    const hasTimeRemaining = true;

    let hasMoreWork = true;

    try {
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        // 如果还有任务，在上一个消息事件结束的之后，再调度下一个消息事件
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      }
    }
  } else {
    isMessageLoopRunning = false;
  }
  // 让步给浏览器
  needsPaint = false;
};

let schedulePerformWorkUntilDeadline;

const channel = new MessageChannel();

const port = channel.port2;

channel.port1.onmessage = performWorkUntilDeadline;
schedulePerformWorkUntilDeadline = () => {
  port.postMessage(null);
};

function requestHostCallback(callback: Function) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

function requestHostTimeout(callback: Function, ms: number) {
  taskTimeoutID = setTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}

function cancelHostTimeout() {
  clearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
}

export {
  ImmediatePriority as ImmediatePriority,
  UserBlockingPriority as UserBlockingPriority,
  NormalPriority as NormalPriority,
  IdlePriority as IdlePriority,
  LowPriority as LowPriority,
  scheduleCallback,
  cancelCallback,
  shouldYieldToHost as shouldYield,
  getCurrentTime as unstable_now,
  requestPaint, // as unstable_requestPaint,
  // requestYield as unstable_requestYield,
};

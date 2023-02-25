import {PriorityLevel, getTimeoutByPriorityLevel} from "./SchedulerPriorities";
import {getCurrentTime, isObject, isFn} from "shared/utils";
import {push, pop, peek} from "./SchedulerMinHeap";

// todo 单线程任务管理器
// 每次只能执行一个任务（优先级、到达的时间）
let isHostCallbackScheduled: boolean = false;
// setTimeout 倒计时任务，每次也只能倒计时一个
// 锁
let isHostTimeoutScheduled: boolean = false;

let taskTimeoutId: number = -1;
// 队列
// ! 不需要React基础
// 1. 创建任务
export interface Task {
  // 标记任务的唯一性
  id: number;
  // 任务执行函数
  callback: any;
  // 优先级 （队列）
  priorityLevel: PriorityLevel;
  // todo time
  // 时间点、时间戳
  startTime: number;
  expirationTime: number;
  sortIndex: number; // 排序的依据（sortIndex）
}
// 2. 创建任务池 （队列），任务池是动态的
// todo taskQueue的具体数据结构
// 立即要执行的任务
// 执行任务的依据应该是 任务优先级和开始时间
// 最小堆
const taskQueue: Array<Task> = [];
// 有delay的任务，不是立即要执行的任务
const timerQueue: Array<Task> = [];

let taskIdCounter = 1;

let frameInterval = 5;
let startTime = -1;

let scheduledHostCallback;

let schedulePerformWorkUntilDeadline;

let isMessageLoopRunning = false;

let isPerformingWork = false;

// 3. 调度任务，此时只是来了一个任务，这个任务并没有立即开始执行
export function scheduleCallback(
  callback,
  priorityLevel: PriorityLevel,
  options?: {delay: number}
) {
  const currentTime = getCurrentTime();
  let startTime;

  if (isObject(options) && options !== null) {
    let delay = options?.delay;
    if (typeof delay === "number" && delay > 0) {
      // delay 是个有效的延迟时间
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  let timeout = getTimeoutByPriorityLevel(priorityLevel);
  // 过期时间不是任务执行完的时间，而是任务开始执行的理论时间
  // expirationTime 是startTime和优先级的结合体
  // 时间点
  let expirationTime = startTime + timeout;

  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };

  // 把newTask放入任务池
  if (startTime > currentTime) {
    // new Task是个延迟任务，应该把任务放入 timerQueue
    // 把 newTask push到最小堆中去
    // sortIndex 是timerQueue任务池中排序的依据
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
    // 如果 taskQueue 中没有任务， newTask 是 timerQueue 中 sortIndex最小的任务
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      if (isHostTimeoutScheduled) {
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    // newTask是个立即要执行的任务，应该把任务放入 taskQueue
    newTask.sortIndex = newTask.expirationTime;
    push(taskQueue, newTask);

    // 检查主线程是否在调度任务
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      // 去调度
      requestHostCallback(flushWork);
    }
  }
}

// 取消倒计时的函数
function cancelHostTimeout() {
  clearTimeout(taskTimeoutId);
  taskTimeoutId = -1;
}

// 倒计时开始的函数
function requestHostTimeout(callback, ms) {
  taskTimeoutId = setTimeout(() => {
    callback(getCurrentTime());
  }, ms) as any;
}

// 倒计时结束
function handleTimeout(currentTime) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);

  // 主线程没有在调度
  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      // 没有立即要执行的任务
      const firstTimer = peek(timerQueue) as Task;
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

// 检查 timerQueue中task的过期性，过期嘞就放到 taskQueue
function advanceTimers(currentTime) {
  let timer = peek(timerQueue) as Task;

  while (timer !== null) {
    // 检查任务的有效性
    if (timer.callback == null) {
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    } else {
      // todo
      return; //break
    }
    timer = peek(timerQueue) as Task;
  }
}

// todo
function requestHostCallback(callback) {
  scheduledHostCallback = callback;

  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

function flushWork(hasTimeRemaining: boolean, initialTime: number) {
  isHostCallbackScheduled = false;

  if (isHostTimeoutScheduled) {
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }

  isPerformingWork = true;

  try {
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    isPerformingWork = false;
  }
}

const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

schedulePerformWorkUntilDeadline = () => {
  port.postMessage(null);
};

// 在过期时间之前执行任务
function performWorkUntilDeadline() {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    const hasTimeRemaining = true;
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline();
      } else {
        scheduledHostCallback = null;
      }
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

// 主线程去调度任务
// 如果把TaskQueque中的任务执行完毕，返回 false ，没有执行完则返回true
function workLoop(hasTimeRemaining: boolean, initialTime: number) {
  let currentTime = initialTime;
  let currentTask = peek(taskQueue) as Task;
  while (currentTask !== null) {
    // 检查当前时间切片是否用完
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      break;
    }
    const {callback} = currentTask;

    if (isFn(callback)) {
      currentTask.callback = null;

      let continuousCallback = callback();
      if (isFn(continuousCallback)) {
        // 任务没有执行完成
        currentTask.callback = continuousCallback;
        advanceTimers(currentTask);
        return;
      } else {
        // 从 taskQueue中删除这个任务
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    } else {
      pop(taskQueue);
    }

    currentTask = peek(taskQueue) as Task;
  }

  if (currentTask !== null) {
    return true;
  } else {
    // 没有任务了
    const firstTimer = peek(timerQueue) as Task;
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}

// 时间切片

// 是否应该交换控制权给主线程
// 当前时间切片是否用完
function shouldYieldToHost() {
  // startTime 是时间切片的开始时间
  // 时间段
  const timeElapsed = getCurrentTime() - startTime;

  if (timeElapsed < frameInterval) {
    return false;
  }

  return true;
}

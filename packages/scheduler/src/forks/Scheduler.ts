// todo 实现一个单线程的任务调度器

import {
  frameYieldMs,
  lowPriorityTimeout,
  normalPriorityTimeout,
  userBlockingPriorityTimeout,
} from "../SchedulerFeatureFlags";
import { peek, pop, push, type Node } from "../SchedulerMinHeap";
import {
  IdlePriority,
  ImmediatePriority,
  LowPriority,
  NormalPriority,
  UserBlockingPriority,
  type PriorityLevel,
} from "../SchedulerPriorities";

export type Callback = (didTimeout: boolean) => Callback | void | null; // 任务的回调函数
export type Task = Node & {
  callback: Callback | null; // 任务的执行函数
  priorityLevel: PriorityLevel; // 任务的优先级
  startTime: number; // 任务的开始时间，不是到达时间，是到达时间+delay
  expirationTime: number; // 过期时间，startTime + timeout
};

export const getCurrentTime = () => performance.now(); // 时间精度比 Date.now() 高

// sy- 全局变量
// 两个最小堆结构的任务池
// 为了高效管理，用到了两个任务池，因为实际上调度的是 taskQueue
let taskQueue: Array<Task> = []; // 没有delay的任务池
let timerQueue: Array<Task> = []; // 有delay的任务池

let taskIdCounter = 1; // 任务 ID 计数器

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var maxSigned31BitInt = 1073741823;

let needsPaint = false; // 是否需要重绘
let frameInterval = frameYieldMs;
let startTime = -1; // 全局变量，和task中的startTime不一样

let currentTask: Task | null = null; // 当前正在执行的任务
let currentPriorityLevel: PriorityLevel = NormalPriority; // 当前任务的优先级

function unstable_scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: { delay?: number }
): Task {
  const currentTime = getCurrentTime();
  let startTime;
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

  let timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      // 立即要执行，不要等待
      // Times out immediately
      timeout = -1;
      break;
    case UserBlockingPriority:
      // 用户交互相关的任务，应该尽快执行，这个值相对较小
      // Eventually times out
      timeout = userBlockingPriorityTimeout;
      break;
    case IdlePriority:
      // Never times out
      timeout = maxSigned31BitInt;
      break;
    case LowPriority:
      // Eventually times out
      timeout = lowPriorityTimeout;
      break;
    case NormalPriority:
    default:
      // Eventually times out
      timeout = normalPriorityTimeout;
      break;
  }

  // 过期时间。任务应该的执行时间
  // fiber中以前有个 expirationTime(update)，现在没了，改成lane了
  let expirationTime = startTime + timeout;

  const newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1, // 初始时未排序
  };

  // 把任务放入对应的任务池中
  if (startTime > currentTime) {
    // 如果任务有延迟，放入 timerQueue,这个任务池中的任务要做的事情是setTimeout
    newTask.sortIndex = startTime; // 按照开始时间排序
    push(timerQueue, newTask);
  } else {
    // 如果任务没有延迟，放入 taskQueue,这个任务池中的任务要做的事情是执行任务
    newTask.sortIndex = expirationTime; // 按照过期时间排序
    push(taskQueue, newTask);
  }

  return newTask;
}

function unstable_cancelCallback(task: Task): void {
  // 取消任务的逻辑
  // 这里不需要做任何事情，因为任务池是一个最小堆，删除元素会破坏堆结构
  // 所以不支持取消任务
  // 可以通过设置 callback 为 null 来标记任务已取消
  task.callback = null;
}

// should yield to the host 要不要把控制权还给主线程
// 时间切片是否到期
function shouldYieldToHost(): boolean {
  if (needsPaint) {
    // Yield now.
    return true;
  }
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    // The main thread has only been blocked for a really short amount of time;
    // smaller than a single frame. Don't yield yet.
    return false;
  }
  // Yield now.
  return true;
}

function requestPaint() {
  needsPaint = true;
}

// todo
function workLoop(initialTime: number) {
  let currentTime = initialTime;
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      // This currentTask hasn't expired, and we've reached the deadline.
      // 如果任务还没有到达过期时间，或者是到达了当前时间切片的截止时间
      break;
    }
    const callback = currentTask.callback;
    if (typeof callback === "function") {
      // 这是个有效的任务，执行
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      if (typeof continuationCallback === "function") {
        // todo
        // callback()
      } else {
        // todo
      }
    } else {
      // 这个时候这个任务是在堆顶，可以直接删除
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
}

export {
  ImmediatePriority as unstable_ImmediatePriority,
  UserBlockingPriority as unstable_UserBlockingPriority,
  NormalPriority as unstable_NormalPriority,
  IdlePriority as unstable_IdlePriority,
  LowPriority as unstable_LowPriority,
  unstable_scheduleCallback,
  unstable_cancelCallback,
  shouldYieldToHost as unstable_shouldYield,
  requestPaint as unstable_requestPaint,
  getCurrentTime as unstable_now,
};

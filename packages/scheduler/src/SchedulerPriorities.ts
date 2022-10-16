export type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;

// 任务优先级
// 优先级越高，值越小
export const NoPriority = 0;
export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
const maxSigned31BitInt = 1073741823;

// Times out immediately
export const IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
export const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
export const NORMAL_PRIORITY_TIMEOUT = 5000;
export const LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
export const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

export function getTimeoutByPriorityLevel(priorityLevel: PriorityLevel) {
  let timeout: number;

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

  return timeout;
}

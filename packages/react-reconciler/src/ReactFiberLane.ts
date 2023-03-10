/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber, FiberRoot} from "./ReactInternalTypes";

// TODO: Ideally these types would be opaque but that doesn't work well with
// our reconciler fork infra, since these leak into non-reconciler packages.

export type Lanes = number;
export type Lane = number;
export type LaneMap<T> = Array<T>;

// import {
//   enableSchedulingProfiler,
//   enableUpdaterTracking,
//   allowConcurrentByDefault,
//   enableTransitionTracing,
// } from 'shared/ReactFeatureFlags';
// import {isDevToolsPresent} from './ReactFiberDevToolsHook.old';
// import {ConcurrentUpdatesByDefaultMode, NoMode} from './ReactTypeOfMode';

export const TotalLanes = 31;

export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001; // 1

export const InputContinuousHydrationLane: Lane = /*    */ 0b0000000000000000000000000000010; // 2
export const InputContinuousLane: Lane = /*             */ 0b0000000000000000000000000000100; // 4

export const DefaultHydrationLane: Lane = /*            */ 0b0000000000000000000000000001000; // 8
export const DefaultLane: Lane = /*                     */ 0b0000000000000000000000000010000; // 16

const TransitionHydrationLane: Lane = /*                */ 0b0000000000000000000000000100000;
const TransitionLanes: Lanes = /*                       */ 0b0000000001111111111111111000000;
const TransitionLane1: Lane = /*                        */ 0b0000000000000000000000001000000;
const TransitionLane2: Lane = /*                        */ 0b0000000000000000000000010000000;
const TransitionLane3: Lane = /*                        */ 0b0000000000000000000000100000000;
const TransitionLane4: Lane = /*                        */ 0b0000000000000000000001000000000;
const TransitionLane5: Lane = /*                        */ 0b0000000000000000000010000000000;
const TransitionLane6: Lane = /*                        */ 0b0000000000000000000100000000000;
const TransitionLane7: Lane = /*                        */ 0b0000000000000000001000000000000;
const TransitionLane8: Lane = /*                        */ 0b0000000000000000010000000000000;
const TransitionLane9: Lane = /*                        */ 0b0000000000000000100000000000000;
const TransitionLane10: Lane = /*                       */ 0b0000000000000001000000000000000;
const TransitionLane11: Lane = /*                       */ 0b0000000000000010000000000000000;
const TransitionLane12: Lane = /*                       */ 0b0000000000000100000000000000000;
const TransitionLane13: Lane = /*                       */ 0b0000000000001000000000000000000;
const TransitionLane14: Lane = /*                       */ 0b0000000000010000000000000000000;
const TransitionLane15: Lane = /*                       */ 0b0000000000100000000000000000000;
const TransitionLane16: Lane = /*                       */ 0b0000000001000000000000000000000;

const RetryLanes: Lanes = /*                            */ 0b0000111110000000000000000000000;
const RetryLane1: Lane = /*                             */ 0b0000000010000000000000000000000;
const RetryLane2: Lane = /*                             */ 0b0000000100000000000000000000000;
const RetryLane3: Lane = /*                             */ 0b0000001000000000000000000000000;
const RetryLane4: Lane = /*                             */ 0b0000010000000000000000000000000;
const RetryLane5: Lane = /*                             */ 0b0000100000000000000000000000000;

export const SomeRetryLane: Lane = RetryLane1;

export const SelectiveHydrationLane: Lane = /*          */ 0b0001000000000000000000000000000;

const NonIdleLanes: Lanes = /*                          */ 0b0001111111111111111111111111111;

export const IdleHydrationLane: Lane = /*               */ 0b0010000000000000000000000000000;
export const IdleLane: Lane = /*                        */ 0b0100000000000000000000000000000;

export const OffscreenLane: Lane = /*                   */ 0b1000000000000000000000000000000;

export const NoTimestamp = -1;

let nextTransitionLane: Lane = TransitionLane1;
let nextRetryLane: Lane = RetryLane1;

// 同步、input、默认、transition、retryLane、SelectiveHydrationLane、IdleHydrationLane、IdleLane、OffscreenLane
function getHighestPriorityLanes(lanes: Lanes | Lane): Lanes {
  switch (getHighestPriorityLane(lanes)) {
    case SyncLane:
      return SyncLane;
    case InputContinuousHydrationLane:
      return InputContinuousHydrationLane;
    case InputContinuousLane:
      return InputContinuousLane;
    case DefaultHydrationLane:
      return DefaultHydrationLane;
    // 初次渲染
    case DefaultLane:
      return DefaultLane;
    case TransitionHydrationLane:
      return TransitionHydrationLane;
    case TransitionLane1:
    case TransitionLane2:
    case TransitionLane3:
    case TransitionLane4:
    case TransitionLane5:
    case TransitionLane6:
    case TransitionLane7:
    case TransitionLane8:
    case TransitionLane9:
    case TransitionLane10:
    case TransitionLane11:
    case TransitionLane12:
    case TransitionLane13:
    case TransitionLane14:
    case TransitionLane15:
    case TransitionLane16:
      return lanes & TransitionLanes;
    case RetryLane1:
    case RetryLane2:
    case RetryLane3:
    case RetryLane4:
    case RetryLane5:
      return lanes & RetryLanes;
    case SelectiveHydrationLane:
      return SelectiveHydrationLane;
    case IdleHydrationLane:
      return IdleHydrationLane;
    case IdleLane:
      return IdleLane;
    case OffscreenLane:
      return OffscreenLane;
    default:
      // This shouldn't be reachable, but as a fallback, return the entire bitmask.
      return lanes;
  }
}

// 获取下个lanes
export function getNextLanes(root: FiberRoot, wipLanes: Lanes): Lanes {
  // 没有 pending work 要执行，bailout
  // 初次渲染时候，取值16
  // setState sync 1
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    return NoLanes;
  }

  let nextLanes = NoLanes;

  const nonIdlePendingLanes = pendingLanes & NonIdleLanes;

  nextLanes = getHighestPriorityLanes(nonIdlePendingLanes);

  if (nextLanes === NoLanes) {
    // 挂起时候
    return NoLanes;
  }

  return nextLanes;
}

export function getMostRecentEventTime(root: FiberRoot, lanes: Lanes): number {
  const eventTimes = root.eventTimes;

  let mostRecentEventTime = NoTimestamp;
  while (lanes > 0) {
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;

    const eventTime = eventTimes[index];
    if (eventTime > mostRecentEventTime) {
      mostRecentEventTime = eventTime;
    }

    lanes &= ~lane;
  }

  return mostRecentEventTime;
}

// 策略和scheduler相同，根据优先级判断过期时间，优先级越大，值越小。
function computeExpirationTime(lane: Lane, currentTime: number) {
  switch (lane) {
    case SyncLane:
    case InputContinuousHydrationLane:
    case InputContinuousLane:
      // 交互行为应该早点被执行，因此过期时间会比较小
      //
      // NOTE: This is set to the corresponding constant as in Scheduler.js.
      // When we made it larger, a product metric in www regressed, suggesting
      // there's a user interaction that's being starved by a series of
      // synchronous updates. If that theory is correct, the proper solution is
      // to fix the starvation. However, this scenario supports the idea that
      // expiration times are an important safeguard when starvation
      // does happen.
      return currentTime + 250;
    case DefaultHydrationLane:
    case DefaultLane:
    case TransitionHydrationLane:
    case TransitionLane1:
    case TransitionLane2:
    case TransitionLane3:
    case TransitionLane4:
    case TransitionLane5:
    case TransitionLane6:
    case TransitionLane7:
    case TransitionLane8:
    case TransitionLane9:
    case TransitionLane10:
    case TransitionLane11:
    case TransitionLane12:
    case TransitionLane13:
    case TransitionLane14:
    case TransitionLane15:
    case TransitionLane16:
      return currentTime + 5000;
    case RetryLane1:
    case RetryLane2:
    case RetryLane3:
    case RetryLane4:
    case RetryLane5:
      // TODO: Retries should be allowed to expire if they are CPU bound for
      // too long, but when I made this change it caused a spike in browser
      // crashes. There must be some other underlying bug; not super urgent but
      // ideally should figure out why and fix it. Unfortunately we don't have
      // a repro for the crashes, only detected via production metrics.
      // 如果CPU bound太久，Retries应当过期。当然可能会出现Bug，但是目前还没遇到。
      return NoTimestamp;
    case SelectiveHydrationLane:
    case IdleHydrationLane:
    case IdleLane:
    case OffscreenLane:
      // Anything idle priority or lower should never expire.
      // 低于idle优先级的，都永远不会过期
      return NoTimestamp;
    default:
      return NoTimestamp;
  }
}

// This returns the highest priority pending lanes regardless of whether they
// are suspended.
// 同步、input、默认、transition、retryLane、SelectiveHydrationLane、IdleHydrationLane、IdleLane、OffscreenLane
export function getHighestPriorityPendingLanes(root: FiberRoot): Lanes {
  return getHighestPriorityLanes(root.pendingLanes);
}

export function includesSyncLane(lanes: Lanes): boolean {
  return (lanes & SyncLane) !== NoLanes;
}

export function includesNonIdleWork(lanes: Lanes): boolean {
  return (lanes & NonIdleLanes) !== NoLanes;
}

export function includesOnlyTransitions(lanes: Lanes): boolean {
  return (lanes & TransitionLanes) === lanes;
}

// 获取优先级最高的lane，lane是在比特位上越往左，优先级越低
// 获取最低位的1，如4194240&-4194240就是64
// 负数原码转换为补码的方法：符号位保持1不变，数值位按位求反，末位加1
export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes;
}

// 同 getHighestPriorityLane
export function pickArbitraryLane(lanes: Lanes): Lane {
  // This wrapper function gets inlined. Only exists so to communicate that it
  // doesn't matter which bit is selected; you can pick any bit without
  // affecting the algorithms where its used. Here I'm using
  // getHighestPriorityLane because it requires the fewest operations.
  return getHighestPriorityLane(lanes);
}

// 其实就是返回比特位上最左边1的位置下标，(从左边往右边数下标，从0开始)
function pickArbitraryLaneIndex(lanes: Lanes) {
  return 31 - Math.clz32(lanes);
}

// 把 lane 按照规则转为 index 下标
// 用于 root.eventTimes和root.expirationTimes 数组，即 LaneMap 类型
function laneToIndex(lane: Lane) {
  return pickArbitraryLaneIndex(lane);
}

// 是否包含某个lane或者某些lane(lanes)
export function includesSomeLane(a: Lanes | Lane, b: Lanes | Lane): boolean {
  return (a & b) !== NoLanes;
}

// set是否包含subset，和 includesSomeLane 不同，includesSomeLane检查的是a和b是否有交叉的lane，注意只要有一个单独的lane相同，则返回true
// 而这里的 isSubsetOfLanes 检查的是 subset 是否是 set 的子集
export function isSubsetOfLanes(set: Lanes, subset: Lanes | Lane): boolean {
  return (set & subset) === subset;
}

// 合并两个lane或者lanes
export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;
}

// 移除某个lane或者lanes，比如执行完节点的 Update 操作之后，则需要移动 fiber.flags 的 Update
export function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
  return set & ~subset;
}

// 与 includesSomeLane 不同，includesSomeLane返回的是是否有交叉
// intersectLanes 返回交叉的lanes
export function intersectLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a & b;
}

// Seems redundant, but it changes the type from a single lane (used for
// updates) to a group of lanes (used for flushing work).
export function laneToLanes(lane: Lane): Lanes {
  return lane;
}

// 如果 a < b, 则说明a的优先级高于b，因为lane是在比特位上越往左，优先级越低
export function higherPriorityLane(a: Lane, b: Lane): Lane {
  // This works because the bit ranges decrease in priority as you go left.
  return a !== NoLane && a < b ? a : b;
}

// 创建一个 LaneMap，即一个空数组
// 在初始化 root.eventTimes 的时候会调用
export function createLaneMap<T>(initial: T): LaneMap<T> {
  // Intentionally pushing one by one.
  // https://v8.dev/blog/elements-kinds#avoid-creating-holes
  const laneMap = [];
  for (let i = 0; i < TotalLanes; i++) {
    laneMap.push(initial);
  }
  return laneMap;
}

// 标记 root 有一个update
// scheduleUpdateOnFiber 时候调用
export function markRootUpdated(
  root: FiberRoot,
  updateLane: Lane,
  eventTime: number
) {
  // 初次渲染 16
  // setState 1
  root.pendingLanes |= updateLane;

  const eventTimes = root.eventTimes;
  const index = laneToIndex(updateLane);
  // We can always overwrite an existing timestamp because we prefer the most
  // recent event, and we assume time is monotonically increasing.
  eventTimes[index] = eventTime;
}

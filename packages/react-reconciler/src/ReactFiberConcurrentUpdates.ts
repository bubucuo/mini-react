import type {Fiber} from "./ReactInternalTypes";
import type {
  SharedQueue as ClassQueue,
  Update as ClassUpdate,
} from "./ReactFiberClassUpdateQueue";
import type {Lane, Lanes} from "./ReactFiberLane";
import {mergeLanes, NoLanes} from "./ReactFiberLane";

import type {FiberRoot} from "./ReactInternalTypes";
import {HostRoot} from "./ReactWorkTags";

export type ConcurrentUpdate = {
  next: ConcurrentUpdate;
  lane: Lane;
};

type ConcurrentQueue = {
  pending: ConcurrentUpdate | null;
};

//  如果有一个render正在进程中，而此时又接收到了一个concurrent事件的更新，那么会等到这个render完成、或者完成或者被中断
// 之后，再把新的concurrent事件更新加入到fiber/hook queue。把它push到数组，这样晚点可以再处理
const concurrentQueues: Array<any> = [];
let concurrentQueuesIndex = 0;

let concurrentlyUpdatedLanes: Lanes = NoLanes;

function enqueueUpdate(
  fiber: Fiber,
  queue: ConcurrentQueue | null,
  update: ConcurrentUpdate | null,
  lane: Lane
) {
  concurrentQueues[concurrentQueuesIndex++] = fiber;
  concurrentQueues[concurrentQueuesIndex++] = queue;
  concurrentQueues[concurrentQueuesIndex++] = update;
  concurrentQueues[concurrentQueuesIndex++] = lane;

  concurrentlyUpdatedLanes = mergeLanes(concurrentlyUpdatedLanes, lane);

  fiber.lanes = mergeLanes(fiber.lanes, lane);

  const alternate = fiber.alternate;

  if (alternate != null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }
}

export function enqueueConcurrentClassUpdate<State>(
  fiber: Fiber,
  queue: ClassQueue<State>,
  update: ClassQueue<State>,
  lane: Lane
): FiberRoot | null {
  const concurrentQueue: ConcurrentQueue = queue;
  const concurrentUpdate: ConcurrentUpdate = update;
  enqueueUpdate(fiber, concurrentQueue, concurrentUpdate, lane);
  return getRootForUpdateFiber(fiber);
}

function getRootForUpdateFiber(sourceFiber: Fiber): FiberRoot | null {
  let node = sourceFiber;

  let parent = node.return;

  while (parent !== null) {
    node = parent;
    parent = node.return;
  }

  return node.tag === HostRoot ? node.stateNode : null;
}

import type {WorkTag} from "./ReactWorkTags";
import type {Flags} from "./ReactFiberFlags";

export type Fiber = {
  // 标记组件类型
  tag: WorkTag;

  // 标记组件在当前层级下的唯一性
  key: null | string;

  // element.type，记录节点在 reconciliation 阶段的类型
  elementType: any;

  // 节点类型
  type: any;

  // 原生组件：字符串 'div' 'p'
  // 类组件：实例
  stateNode: any;

  // 父组件 fiber
  return: Fiber | null;

  // 第一个子节点
  child: Fiber | null;
  // 下一个兄弟
  sibling: Fiber | null;
  // 在子节点中的下标。用于 diff 时候判断节点是否发生位置移动
  // 因为children是单链表，所以需要单独记录下标位置
  index: number;

  //  props属性
  pendingProps: any;
  memoizedProps: any;

  // update queue
  updateQueue: any;

  // 类组件：state
  // 函数组件：hook0
  memoizedState: any;

  // Effect
  flags: Flags;
  subtreeFlags: Flags;
  // 要删除的子节点
  deletions: Array<Fiber> | null;

  // Singly linked list fast path to the next fiber with side-effects.
  nextEffect: Fiber | null;

  // lanes: Lanes;
  // childLanes: Lanes;

  // 用于 diff 阶段
  alternate: Fiber | null;
};

export type Container =
  | (Element & {_reactRootContainer?: FiberRoot})
  | (Document & {_reactRootContainer?: FiberRoot})
  | (DocumentFragment & {_reactRootContainer?: FiberRoot});

export type FiberRoot = {
  containerInfo: Container;
  current: Fiber;

  // 将要被提交的 work-in-progress HostRoot
  finishedWork: Fiber | null;

  // Scheduler.scheduleCallback 返回的节点，记录下一个任务
  callbackNode: any;
};

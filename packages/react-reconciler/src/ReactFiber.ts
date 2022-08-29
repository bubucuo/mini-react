import {NoFlags, Placement} from "./ReactFiberFlags";
import type {WorkTag} from "./ReactWorkTags";
import {NoLanes} from "./ReactFiberLane";
import type {Fiber} from "./ReactInternalTypes";

import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostText,
} from "./ReactWorkTags";

import {isFn, isStr, isUndefined} from "./utils";

export function createFiber(vnode: any, returnFiber: any) {
  const fiber = {
    tag: 0,
    // 类型
    type: vnode.type,
    key: vnode.key,
    // 属性
    props: vnode.props,
    // 不同类型的组件， stateNode也不同
    // 原生标签 dom节点
    // class 实例
    stateNode: null,

    // 第一个子fiber
    child: null,
    // 下一个兄弟节点
    sibling: null,
    return: returnFiber,

    flags: Placement,

    // 记录节点在当前层级下的位置
    index: null,

    // old fiber
    alternate: null,

    deletions: [],

    // 函数组件存的是hook0
    memorizedState: null,
  };

  const {type} = vnode;

  if (isStr(type)) {
    fiber.tag = HostComponent;
  } else if (isFn(type)) {
    // todo 函数以及类组件
    fiber.tag = type.prototype.isReactComponent
      ? ClassComponent
      : FunctionComponent;
  } else if (isUndefined(type)) {
    fiber.tag = HostText;
    fiber.props = {children: vnode};
  } else {
    fiber.tag = Fragment;
  }

  return fiber;
}

// function createFiber(tag: WorkTag, pendingProps: any, key: null | string) {
//   return new FiberNode(tag, pendingProps, key);
// }

function FiberNode(tag: WorkTag, pendingProps: any, key: null | string) {
  this.tag = tag;
  this.key = key;
  this.type = null;
  this.stateNode = null;

  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;

  this.flags = NoFlags;
  this.deletions = null;
  this.lanes = NoLanes;

  this.alternate = null;
}

export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.deletions = null;
  }

  workInProgress.flags = current.flags;
  workInProgress.lanes = current.lanes;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedSta;
  workInProgress.updateQueue = current.updateQueue;

  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;

  return workInProgress;
}

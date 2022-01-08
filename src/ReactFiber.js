import { Placement } from "./utils";

export function createFiber(vnode, returnFiber) {
  const fiber = {
    type: vnode.type,
    key: vnode.key,
    props: vnode.props,
    // 原生标签 DOM
    // class组件 实例
    stateNode: null,

    // 第一个子fiber
    child: null,
    // 下一个兄弟fiber
    sibling: null,
    return: returnFiber,

    // 标记fiber任务类型，节点插入、更新、删除
    flags: Placement,

    index: null,
  };

  return fiber;
}

import { FunctionComponent, HostComponent } from "./ReactWorkTags";
import { isFn, isStr, Placement } from "./utils";

export function createFiber(vnode, returnFiber) {
  const fiber = {
    // 类型
    type: vnode.type,
    key: vnode.key,
    // 属性
    props: vnode.props,
    // 原生标签 dom节点
    // 函数组件
    // 类组件 实例
    stateNode: null,

    // 第一个子节点 fiber
    child: null,
    // 下一个兄弟fiber
    sibling: null,
    // 父fiber
    return: returnFiber,

    // 记录位置
    index: null,
    // old fiber
    alternate: null,
    // 标记fiber effect，比如插入、更新
    flags: Placement,
  };

  // 判断组件类型
  const { type } = vnode;
  if (isStr(type)) {
    fiber.tag = HostComponent;
  } else if (isFn(type)) {
    // ?
    // fiber.tag = FunctionComponent
  } else {
    //   Fragment
  }

  return fiber;
}

// props属性 state状态

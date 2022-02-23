import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostText,
} from "./ReactWorkTags";
import { isFn, isStr, isUndefined, Placement } from "./utils";

export function createFiber(vnode, returnFiber) {
  const fiber = {
    type: vnode.type,
    key: vnode.key,
    props: vnode.props, // 属性

    // 第一个子节点fiber
    child: null,
    // 下一个兄弟fiber
    sibling: null,
    // 父fiber
    return: returnFiber,

    // 原生标签 dom
    // 类组件 类实例
    stateNode: null,

    // 节点下标
    index: null,

    // old fiber
    alternate: null,

    flags: Placement,
  };

  const { type } = vnode;

  if (isStr(type)) {
    // 原生标签
    fiber.tag = HostComponent;
  } else if (isFn(type)) {
    // 函数组件 类组件
    fiber.tag = type.prototype.isReactComponent
      ? ClassComponent
      : FunctionComponent;
  } else if (isUndefined(type)) {
    fiber.tag = HostText;
    fiber.props = { children: vnode };
  } else {
    fiber.tag = Fragment;
  }

  return fiber;
}

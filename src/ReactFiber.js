import { FunctionComponent, HostComponent } from "./ReactWorkTags";
import { isFn, isStr } from "./utils";

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
  };

  const { type } = vnode;

  if (isStr(type)) {
    // 原生标签
    fiber.tag = HostComponent;
  } else if (isFn(type)) {
    fiber.tag = FunctionComponent;
  }

  return fiber;
}

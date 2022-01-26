import { createFiber } from "./ReactFiber";
import { isArray, isStringOrNumber, updateNode } from "./utils";

// 原生标签的fiber的更新
export function updateHostComponent(wip) {
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type);
    updateNode(wip.stateNode, wip.props);
  }

  // 协调子节点
  reconcileChildren(wip, wip.props.children);
}

export function updateFunctionComponent(wip) {
  const { type, props } = wip;
  const children = type(props);
  reconcileChildren(wip, children);
}

// 协调子节点
function reconcileChildren(wip, children) {
  if (isStringOrNumber(children)) {
    return;
  }

  const newChildren = isArray(children) ? children : [children];

  // 记录上一个fiber
  let previousNewFiber = null;
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    const newFiber = createFiber(newChild, wip);

    if (i === 0) {
      wip.child = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
  }
}

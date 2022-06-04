import { createFiber } from "./ReactFiber";
import { isArray, isStringOrNumber, updateNode } from "./utils";

export function updateHostComponent(wip) {
  if (!wip.stateNode) {
    // 创建节点
    wip.stateNode = document.createElement(wip.type);
  }
  updateNode(wip.stateNode, wip.props);
  reconcileChildren(wip, wip.props.children);
}

// 初次渲染
// 协调 伪diff
// old abc
// new bc
function reconcileChildren(wip, children) {
  if (isStringOrNumber(children)) {
    return;
  }
  const newChildren = isArray(children) ? children : [children];

  let previousNewFiber = null;
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    if (newChild == null) {
      continue;
    }
    const newFiber = createFiber(newChild, wip);
    if (previousNewFiber == null) {
      wip.child = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }

    previousNewFiber = newFiber;
  }
}

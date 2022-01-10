import { createFiber } from "./ReactFiber";
import { isArray, isStringOrNumber, updateNode } from "./utils";

// 原生标签函数
export function updateHostComponent(wip) {
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type);
    // 属性
    updateNode(wip.stateNode, wip.props);
  }
  // 子节点
  reconcileChildren(wip, wip.props.children);
}

//
export function updateFunctionComponent(wip) {
  const { type, props } = wip;

  const children = type(props);

  reconcileChildren(wip, children);
}

export function updateClassComponent(wip) {
  const { type, props } = wip;

  const instance = new type(props);
  const children = instance.render();

  reconcileChildren(wip, children);
}

function reconcileChildren(wip, children) {
  if (isStringOrNumber(children)) {
    return;
  }

  const newChildren = isArray(children) ? children : [children];
  let previousNewFiber = null; //记录上一次的fiber
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

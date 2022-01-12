import { renderWithHooks } from "./hooks";
import { createFiber } from "./ReactFiber";
import { isArray, isStringOrNumber, Update, updateNode } from "./utils";

// 原生标签函数
export function updateHostComponent(wip) {
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type);
    // 属性
    updateNode(wip.stateNode, {}, wip.props);
  }
  // 子节点
  reconcileChildren(wip, wip.props.children);
}

export function updateTextComponent(wip) {
  wip.stateNode = document.createTextNode(wip.props.children);
}

export function updateFragmentComponent(wip) {
  reconcileChildren(wip, wip.props.children);
}

//
export function updateFunctionComponent(wip) {
  renderWithHooks(wip);
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

// a b c
// b c
function reconcileChildren(wip, children) {
  if (isStringOrNumber(children)) {
    return;
  }

  const newChildren = isArray(children) ? children : [children];
  let previousNewFiber = null; //记录上一次的fiber
  let oldFiber = wip.alternate?.child;
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    const newFiber = createFiber(newChild, wip);

    const same = sameNode(newFiber, oldFiber);

    if (same) {
      Object.assign(newFiber, {
        stateNode: oldFiber.stateNode,
        alternate: oldFiber,
        flags: Update,
      });
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (i === 0) {
      wip.child = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }

    previousNewFiber = newFiber;
  }
}

// 1. 同一层级 2.相同的类型 3. 相同的key
function sameNode(a, b) {
  return a && b && a.type === b.type && a.key === b.key;
}

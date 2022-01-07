import { isArray, isStr, Update, updateNode } from "./utils";
import createFiber from "./createFiber";
import { renderWithHooks } from "./hooks";

export function updateHostComponent(wip) {
  // 更新节点自己
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type);
    updateNode(wip.stateNode, {}, wip.props);
  }

  // 协调子节点
  reconcileChildren(wip, wip.props.children);
}

export function updateFunctionComponent(wip) {
  renderWithHooks(wip);

  // 更新节点自己
  // 协调子节点
  const { type, props } = wip;
  const children = type(props);
  reconcileChildren(wip, children);
}

function reconcileChildren(wip, children) {
  if (isStr(children)) {
    return;
  }

  const newChildren = isArray(children) ? children : [children];
  let previousNewFiber = null;
  // 头结点
  let oldFiber = wip.alternate && wip.alternate.child;
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    if (newChild === null) {
      continue;
    }
    const newFiber = createFiber(newChild, wip);

    const same = sameNode(oldFiber, newFiber);
    if (same) {
      Object.assign(newFiber, {
        alternate: oldFiber,
        stateNode: oldFiber.stateNode,
        flags: Update,
      });
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (previousNewFiber === null) {
      wip.child = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }

    previousNewFiber = newFiber;
  }
}

function sameNode(a, b) {
  return !!(a && b && a.type === b.type && a.key === b.key);
}

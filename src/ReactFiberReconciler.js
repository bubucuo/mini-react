import { renderWithHooks } from "./hooks";
import { createFiber } from "./ReactFiber";
import { isArray, isStringOrNumber, Update, updateNode } from "./utils";

// 原生标签的fiber的更新
export function updateHostComponent(wip) {
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type);
    updateNode(wip.stateNode, {}, wip.props);
  }

  // 协调子节点
  reconcileChildren(wip, wip.props.children);
}

export function updateTextComponent(wip) {
  wip.stateNode = document.createTextNode(wip.props.children);
}

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

export function updateFragmentComponent(wip) {
  const { props } = wip;
  reconcileChildren(wip, props.children);
}

function deleteChild(returnFiber, childToDelete) {
  const deletions = returnFiber.deletions;
  if (deletions) {
    returnFiber.deletions.push(childToDelete);
  } else {
    returnFiber.deletions = [childToDelete];
  }
}
// todo
// 协调子节点
// list 132
// arr  23

function reconcileChildren(wip, children) {
  if (isStringOrNumber(children)) {
    return;
  }

  const newChildren = isArray(children) ? children : [children];

  // 记录上一个fiber
  let previousNewFiber = null;
  let oldFiber = wip.alternate?.child;
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    const newFiber = createFiber(newChild, wip);

    if (newFiber == null) {
      continue;
    }

    const same = sameNode(newFiber, oldFiber);

    if (same) {
      Object.assign(newFiber, {
        stateNode: oldFiber.stateNode,
        alternate: oldFiber,
        flags: Update,
      });
    }

    if (!same && oldFiber) {
      deleteChild(wip, oldFiber);
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
  return a && b && a.type === b.type && a.key === b.key;
}

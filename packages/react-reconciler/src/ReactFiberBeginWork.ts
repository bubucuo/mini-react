import {createFiberFromElement} from "./ReactFiber";
import {Placement} from "./ReactFiberFlags";
import {Fiber} from "./ReactInternalTypes";
import {HostComponent, HostRoot} from "./ReactWorkTags";
import {isStr} from "../../shared/utils";

export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  switch (workInProgress.tag) {
    // 原生标签根节点
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    // 原生标签
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    // todo
    // 函数组件
    // 类组件
    // Fragment
    // 文本
  }
}

function updateHostRoot(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  return workInProgress.child;
}

// 原生标签
function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  const type = workInProgress.type;
  if (!workInProgress.stateNode) {
    // dom节点
    workInProgress.stateNode = document.createElement(type);
    // todo
    updateNode(workInProgress.stateNode, workInProgress.pendingProps);
  }

  let nextChildren = workInProgress.pendingProps.children;

  const isDirectTextChild = shouldSetTextContent(
    type,
    workInProgress.pendingProps
  );

  if (isDirectTextChild) {
    nextChildren = null;
    return null;
  }

  workInProgress.child = reconcileChildren(
    current,
    workInProgress,
    nextChildren
  );

  return workInProgress.child;
}

// 协调子节点
// 返回 child ,第一个子fiber
// diff
// 只适合初次渲染
function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any // 对象、数组、字符串
) {
  const newChildren = Array.isArray(nextChildren)
    ? nextChildren
    : [nextChildren];

  let newIndex = 0;
  let resultingFirstChild = null;
  let previousNewFiber = null;
  for (; newIndex < newChildren.length; newIndex++) {
    const newChild = newChildren[newIndex];
    if (newChild === null) {
      continue;
    }
    const newFiber = createFiberFromElement(newChild, workInProgress);
    // todo 初次更新
    newFiber.flags = Placement;

    if (previousNewFiber === null) {
      // newFiber 是第0个fiber
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }

    previousNewFiber = newFiber;
  }

  return resultingFirstChild;
}

function shouldSetTextContent(type: string, props: any): boolean {
  return (
    type === "textarea" ||
    type === "noscript" ||
    typeof props.children === "string" ||
    typeof props.children === "number" ||
    (typeof props.dangerouslySetInnerHTML === "object" &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

export function updateNode(dom, nextVal) {
  Object.keys(nextVal).forEach((k) => {
    if (k === "children") {
      if (isStr(nextVal[k])) {
        dom.textContent = nextVal[k];
      }
    } else {
      dom[k] = nextVal[k];
    }
  });
}

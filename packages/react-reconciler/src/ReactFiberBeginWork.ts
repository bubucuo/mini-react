import {isStr} from "shared/utils";
import {createFiberFromElement} from "./ReactFiber";
import {Placement} from "./ReactFiberFlags";
import {Fiber} from "./ReactInternalTypes";
import {HostComponent, HostRoot} from "./ReactWorkTags";

// 1. 处理当前fiber，因为不同组件对应的fiber处理方式不同，
// 2. 返回子节点
export function beginWork(current: Fiber | null, workInProgress: Fiber) {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);

    case HostComponent:
      return updateHostComponent(current, workInProgress);
  }
}

function updateHostRoot(current: Fiber | null, workInProgress: Fiber) {
  return workInProgress.child;
}

function updateHostComponent(current: Fiber | null, workInProgress: Fiber) {
  const {type} = workInProgress;
  if (!workInProgress.stateNode) {
    workInProgress.stateNode = document.createElement(type);
    // 更新属性
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

  console.log(
    "%c [  ]-47",
    "font-size:13px; background:pink; color:#bf2c9f;",
    workInProgress
  );
  return workInProgress.child;
}

// 1. 返回 child：第一个子fiber
// 2. 构建 child 单链表
function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any // 数组、对象、文本
): Fiber | null {
  const newChildren = Array.isArray(nextChildren)
    ? nextChildren
    : [nextChildren];

  let newIndex = 0;
  let resultingFirstChild = null;
  let previousNewFiber = null;
  for (; newIndex < newChildren.length; newIndex++) {
    const newChild = newChildren[newIndex];
    if (newChild == null) {
      continue;
    }

    const newFiber = createFiberFromElement(newChild, workInProgress);

    // 初次渲染
    newFiber.flags = Placement;
    if (previousNewFiber === null) {
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

function updateNode(dom, nextVal) {
  Object.keys(nextVal).forEach((k) => {
    if (k === "children") {
      // 子节点、文本
      if (isStr(nextVal[k])) {
        dom.textContent = nextVal[k];
      }
    } else {
      // 普通属性，不包括style
      dom[k] = nextVal[k];
    }
  });
}

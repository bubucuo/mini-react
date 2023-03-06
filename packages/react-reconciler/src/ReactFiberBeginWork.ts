import {isNum, isStr} from "shared/utils";
import {reconcileChildren} from "./ReactChildFiber";
import {createFiberFromElement, createFiberFromText} from "./ReactFiber";
import {Placement} from "./ReactFiberFlags";
import {renderHooks} from "./ReactFiberHooks";
import {Fiber} from "./ReactInternalTypes";
import {
  HostComponent,
  HostRoot,
  FunctionComponent,
  ClassComponent,
  HostText,
  Fragment,
} from "./ReactWorkTags";

// 1. 处理当前fiber，因为不同组件对应的fiber处理方式不同，
// 2. 返回子节点
export function beginWork(current: Fiber | null, workInProgress: Fiber) {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);

    case HostComponent:
      return updateHostComponent(current, workInProgress);

    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress);
    case ClassComponent:
      return updateClassComponent(current, workInProgress);

    // 文本节点
    case HostText:
      return updateHostText(current, workInProgress);

    // 文本节点
    case Fragment:
      return updateFragment(current, workInProgress);
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
    updateNode(workInProgress.stateNode, {}, workInProgress.pendingProps);
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

// 函数组件
function updateFunctionComponent(current: Fiber | null, workInProgress: Fiber) {
  renderHooks(workInProgress);
  const {type, pendingProps} = workInProgress;
  const children = type(pendingProps);

  workInProgress.child = reconcileChildren(current, workInProgress, children);
  return workInProgress.child;
}

// 类组件
function updateClassComponent(current: Fiber | null, workInProgress: Fiber) {
  const {type, pendingProps} = workInProgress;
  const instance = new type(pendingProps);
  workInProgress.stateNode = instance;

  const children = instance.render();

  workInProgress.child = reconcileChildren(current, workInProgress, children);
  return workInProgress.child;
}

// 文本节点
function updateHostText(current: Fiber | null, workInProgress: Fiber) {
  const {pendingProps} = workInProgress;

  if (!workInProgress.stateNode) {
    workInProgress.stateNode = document.createTextNode(pendingProps);
  }
  return null;
}

function updateFragment(current: Fiber | null, workInProgress: Fiber) {
  workInProgress.child = reconcileChildren(
    current,
    workInProgress,
    workInProgress.pendingProps.children
  );
  return workInProgress.child;
}

// 1. 返回 child：第一个子fiber
// 2. 构建 child 单链表
function _reconcileChildren(
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

    let newFiber: Fiber;
    if (isStr(newChild)) {
      newFiber = createFiberFromText(newChild, workInProgress);
    } else {
      newFiber = createFiberFromElement(newChild, workInProgress);
    }

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

// 合成事件
export function updateNode(node, prevVal, nextVal) {
  Object.keys(prevVal)
    // .filter(k => k !== "children")
    .forEach((k) => {
      if (k === "children") {
        // 有可能是文本
        if (isStr(nextVal[k]) || isNum(nextVal[k])) {
          node.textContent = "";
        }
      } else if (k.slice(0, 2) === "on") {
        const eventName = k.slice(2).toLocaleLowerCase();
        node.removeEventListener(eventName, prevVal[k]);
      } else {
        if (!(k in nextVal)) {
          node[k] = "";
        }
      }
    });

  Object.keys(nextVal)
    // .filter(k => k !== "children")
    .forEach((k) => {
      if (k === "children") {
        // 有可能是文本
        if (isStr(nextVal[k]) || isNum(nextVal[k])) {
          node.textContent = nextVal[k] + "";
        }
      } else if (k.slice(0, 2) === "on") {
        const eventName = k.slice(2).toLocaleLowerCase();
        node.addEventListener(eventName, nextVal[k]);
      } else {
        node[k] = nextVal[k];
      }
    });
}

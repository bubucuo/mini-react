import {createFiberFromElement, createFiberFromText} from "./ReactFiber";
import {Placement} from "./ReactFiberFlags";
import {Fiber} from "./ReactInternalTypes";
import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./ReactWorkTags";
import {isStr, isNum} from "../../shared/utils";
import {renderHooks} from "./ReactFiberHooks";
import {reconcileChildren} from "./ReactChildFiber";

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
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress);
    // 类组件
    case ClassComponent:
      return updateClassComponent(current, workInProgress);
    // 文本
    case HostText:
      return updateHostText(current, workInProgress);

    // Fragment
    case Fragment:
      return updateFragment(current, workInProgress);
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

  return workInProgress.child;
}

// 函数组件
// todo hooks
function updateFunctionComponent(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  renderHooks(workInProgress);
  const {type, pendingProps} = workInProgress;

  const children = type(pendingProps);

  workInProgress.child = reconcileChildren(current, workInProgress, children);

  return workInProgress.child;
}

// 类组件
function updateClassComponent(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  const {type, pendingProps} = workInProgress;

  const instance = new type(pendingProps);
  workInProgress.stateNode = instance;

  const children = instance.render();

  workInProgress.child = reconcileChildren(current, workInProgress, children);

  return workInProgress.child;
}

// 文本节点
function updateHostText(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  const {pendingProps} = workInProgress;

  if (!workInProgress.stateNode) {
    workInProgress.stateNode = document.createTextNode(pendingProps);
  }

  return null;
}

// Fragment
function updateFragment(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  workInProgress.child = reconcileChildren(
    current,
    workInProgress,
    workInProgress.pendingProps.children
  );
  return workInProgress.child;
}

// 协调子节点
// 返回 child ,第一个子fiber
// diff
// 只适合初次渲染
function _reconcileChildren(
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

    let newFiber: Fiber;

    if (isStr(newChild)) {
      newFiber = createFiberFromText(newChild, workInProgress);
    } else {
      newFiber = createFiberFromElement(newChild, workInProgress);
    }
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

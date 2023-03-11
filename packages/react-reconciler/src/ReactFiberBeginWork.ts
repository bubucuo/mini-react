import {createFiberFromElement, createFiberFromText} from "./ReactFiber";
import {Placement} from "./ReactFiberFlags";
import {Fiber} from "./ReactInternalTypes";
import {
  ClassComponent,
  ContextConsumer,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./ReactWorkTags";
import {isStr, isNum} from "../../shared/utils";
import {renderHooks} from "./ReactFiberHooks";
import {reconcileChildren} from "./ReactChildFiber";
import {ContextProvider} from "./ReactWorkTags";
import {
  prepareToReadContext,
  pushProvider,
  readContext,
} from "./ReactFiberNewContext";

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

    case ContextProvider:
      return updateContextProvider(current, workInProgress);

    case ContextConsumer:
      return updateContextConsumer(current, workInProgress);
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
  prepareToReadContext(workInProgress);
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
  prepareToReadContext(workInProgress);

  const {type, pendingProps} = workInProgress;
  const context = type.contextType;
  const instance = new type(pendingProps);
  instance.context = readContext(context);
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

function updateContextProvider(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  // set context value
  // 接收属性值 value ，并且要把它存起来
  const context = workInProgress.type._context;
  const newValue = workInProgress.pendingProps.value;
  pushProvider(context, newValue);

  workInProgress.child = reconcileChildren(
    current,
    workInProgress,
    workInProgress.pendingProps.children
  );
  return workInProgress.child;
}

function updateContextConsumer(current: Fiber | null, workInProgress: Fiber) {
  const context = workInProgress.type;
  const newProps = workInProgress.pendingProps;
  const render = newProps.children;

  prepareToReadContext(workInProgress);

  const newValue = readContext(context);

  const newChildren = render(newValue);

  workInProgress.child = reconcileChildren(
    current,
    workInProgress,
    newChildren
  );
  return workInProgress.child;
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

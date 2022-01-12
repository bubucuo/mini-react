import {
  updateClassComponent,
  updateFragmentComponent,
  updateFunctionComponent,
  updateHostComponent,
  updateTextComponent,
} from "./ReactFiberReconciler";
import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostText,
} from "./ReactWorkTags";
import { scheduleCallback } from "./scheduler";
import { isFn, isStr, Placement, Update, updateNode } from "./utils";

// work in progress 当前正在工作中的 fiber
let wip = null;
let wipRoot = null;

export function scheduleUpdateOnFiber(fiber) {
  wip = fiber;
  wipRoot = fiber;

  scheduleCallback(workLoop);
}

// 1. 执行当前wip任务
// 2. 更新wip
function performUnitOfWork() {
  const { tag } = wip;
  switch (tag) {
    case HostComponent:
      updateHostComponent(wip);
      break;
    case HostText:
      updateTextComponent(wip);
      break;
    case ClassComponent:
      updateClassComponent(wip);
      break;
    case FunctionComponent:
      updateFunctionComponent(wip);
      break;
    case Fragment:
      updateFragmentComponent(wip);
      break;

    default:
      break;
  }

  // 深度优先遍历(国王的故事)
  if (wip.child) {
    wip = wip.child;
    return;
  }

  let next = wip;

  while (next) {
    if (next.sibling) {
      wip = next.sibling;
      return;
    }
    next = next.return;
  }
  wip = null;
}

function workLoop() {
  while (wip) {
    performUnitOfWork();
  }

  if (!wip && wipRoot) {
    commitRoot();
  }
}

function commitRoot() {
  commitWorker(wipRoot);
  wipRoot = null;
}

function commitWorker(wip) {
  if (!wip) {
    return;
  }
  // 1. 更新自己

  const { flags, stateNode } = wip;

  // 父dom节点
  let parentNode = getParentNode(wip.return); // wip.return.stateNode;

  if (flags & Placement && stateNode) {
    parentNode.appendChild(stateNode);
  }

  if (flags & Update && stateNode) {
    updateNode(stateNode, wip.alternate.props, wip.props);
  }

  if (wip.deletions) {
    commitDeletion(wip.deletions, stateNode || parentNode);
  }

  // 2. 更新子节点
  commitWorker(wip.child);
  // 2. 更新兄弟节点
  commitWorker(wip.sibling);
}

function getParentNode(wip) {
  let tem = wip;
  while (tem) {
    if (tem.stateNode) {
      return tem.stateNode;
    }
    tem = tem.return;
  }
}

// deletions: fiber
function commitDeletion(deletions, parentNode) {
  for (let i = 0; i < deletions.length; i++) {
    const deletion = deletions[i];
    parentNode.removeChild(getStateNode(deletion));
  }
}

function getStateNode(fiber) {
  let tem = fiber;
  while (!tem.stateNode) {
    tem = tem.child;
  }
  return tem.stateNode;
}

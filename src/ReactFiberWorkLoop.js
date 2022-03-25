import {
  updateClassComponent,
  updateFragmentComponent,
  updateFunctionComponent,
  updateHostComponent,
  updateHostTextComponent,
} from "./ReactFiberReconciler";
import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostText,
} from "./ReactWorkTags";
import { scheduleCallback } from "./scheduler";
import { Placement, Update, updateNode } from "./utils";

let wip = null; // work in progress 当前正在工作中的
let wipRoot = null;

// 初次渲染和更新
export function scheduleUpdateOnFiber(fiber) {
  wip = fiber;
  wipRoot = fiber;

  scheduleCallback(workLoop);
}

//
function performUnitOfWork() {
  const { tag } = wip;

  // todo 1. 更新当前组件
  switch (tag) {
    case HostComponent:
      updateHostComponent(wip);
      break;

    case FunctionComponent:
      updateFunctionComponent(wip);
      break;

    case ClassComponent:
      updateClassComponent(wip);
      break;
    case Fragment:
      updateFragmentComponent(wip);
      break;
    case HostText:
      updateHostTextComponent(wip);
      break;
    default:
      break;
  }

  // todo 2. 下一个更新谁 深度优先遍历 （国王的故事）
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

// requestIdleCallback(workLoop);

// 提交
function commitRoot() {
  commitWorker(wipRoot);
  wipRoot = null;
}

function commitWorker(wip) {
  if (!wip) {
    return;
  }

  // 1. 提交自己
  // parentNode是父DOM节点

  const parentNode = getParentNode(wip.return); /// wip.return.stateNode;
  const { flags, stateNode } = wip;
  if (flags & Placement && stateNode) {
    // 1
    // 0 1 2 3 4
    // 2 1 3 4
    const before = getHostSibling(wip.sibling);
    insertOrAppendPlacementNode(stateNode, before, parentNode);
    // parentNode.appendChild(stateNode);
  }

  if (flags & Update && stateNode) {
    // 更新属性
    updateNode(stateNode, wip.alternate.props, wip.props);
  }

  if (wip.deletions) {
    // 删除wip的子节点
    commitDeletions(wip.deletions, stateNode || parentNode);
  }

  if (wip.tag === FunctionComponent) {
    invokeHooks(wip);
  }

  // 2. 提交子节点
  commitWorker(wip.child);
  // 3. 提交兄弟
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

function commitDeletions(deletions, parentNode) {
  for (let i = 0; i < deletions.length; i++) {
    parentNode.removeChild(getStateNode(deletions[i]));
  }
}

// 不是每个fiber都有dom节点
function getStateNode(fiber) {
  let tem = fiber;

  while (!tem.stateNode) {
    tem = tem.child;
  }

  return tem.stateNode;
}

function getHostSibling(sibling) {
  while (sibling) {
    if (sibling.stateNode && !(sibling.flags & Placement)) {
      return sibling.stateNode;
    }
    sibling = sibling.sibling;
  }
  return null;
}

function insertOrAppendPlacementNode(stateNode, before, parentNode) {
  if (before) {
    parentNode.insertBefore(stateNode, before);
  } else {
    parentNode.appendChild(stateNode);
  }
}

function invokeHooks(wip) {
  const { updateQueueOfEffect, updateQueueOfLayout } = wip;

  for (let i = 0; i < updateQueueOfLayout.length; i++) {
    const effect = updateQueueOfLayout[i];
    effect.create();
  }

  for (let i = 0; i < updateQueueOfEffect.length; i++) {
    const effect = updateQueueOfEffect[i];

    scheduleCallback(() => {
      effect.create();
    });
  }
}

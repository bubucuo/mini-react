import { updateHostComponent } from "./ReactFiberReconciler";
import { isStr, Placement } from "./utils";

// work in progress 当前正在工作中的 fiber
let wip = null;
let wipRoot = null;

export function scheduleUpdateOnFiber(fiber) {
  wip = fiber;
  wipRoot = fiber;
}

// 1.执行当前wip任务
// 2. 更新wip
function performUnitOfWork() {
  const { type } = wip;
  if (isStr(type)) {
    updateHostComponent(wip);
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

function workLoop(IdleDeadline) {
  while (wip && IdleDeadline.timeRemaining() > 0) {
    performUnitOfWork();
  }

  if (!wip && wipRoot) {
    commitRoot();
  }
}

requestIdleCallback(workLoop);

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
  let parentNode = getParentNode(wip.return);

  if (flags && Placement && stateNode) {
    parentNode.appendChild(stateNode);
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
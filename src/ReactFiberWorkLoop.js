import {
  updateFunctionComponent,
  updateHostComponent,
} from "./ReactFiberReconciler";
import { FunctionComponent, HostComponent } from "./ReactWorkTags";

let wip = null; // work in progress 当前正在工作中的
let wipRoot = null;

export function scheduleUpdateOnFiber(fiber) {
  wip = fiber;
  wipRoot = fiber;
}

// 1. 执行当前fiber任务（wip）
// 2. 更新wip

function performUnitOfWork() {
  //  todo 执行当前fiber任务（wip）
  const { tag } = wip;

  switch (tag) {
    case HostComponent:
      updateHostComponent(wip);
      break;

    case FunctionComponent:
      updateFunctionComponent(wip);
      break;

    default:
      break;
  }

  // 2. 更新wip 深度优先遍历 （王朝的故事）
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

function commitRoot() {
  commitWorker(wipRoot);
  wipRoot = null;
}

function commitWorker(wip) {
  if (!wip) {
    return;
  }
  // 1. 自己
  const { stateNode } = wip;
  // 父dom节点
  const parentNode = getParentNode(wip.return); //wip.return.stateNode;
  if (stateNode) {
    parentNode.appendChild(stateNode);
  }
  // 2.
  commitWorker(wip.child);
  // 3.
  commitWorker(wip.sibling);
}

function workLoop(IdleDeadLine) {
  while (wip && IdleDeadLine.timeRemaining() > 0) {
    performUnitOfWork();
  }

  if (!wip && wipRoot) {
    commitRoot();
  }
}

requestIdleCallback(workLoop);

function getParentNode(wip) {
  let tem = wip;
  while (tem) {
    if (tem.stateNode) {
      return tem.stateNode;
    }
    tem = tem.return;
  }
}

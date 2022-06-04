import { updateHostComponent } from "./ReactFiberReconciler";
import { HostComponent } from "./ReactWorkTags";
import { Placement } from "./utils";

// work in progress 当前正在工作中的
let wip = null;
let wipRoot = null;

export function scheduleUpdateOnFiber(fiber) {
  wip = fiber;
  wipRoot = fiber;
}

// 1. 处理wip
// 2. 更新wip
function performUnitWork() {
  // todo 1. 处理wip
  const { tag } = wip;

  switch (tag) {
    case HostComponent:
      updateHostComponent(wip);
      break;
    default:
      break;
  }

  // 2. 更新wip 国王的故事 深度优先
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
  while (IdleDeadline.timeRemaining() > 0 && wip) {
    performUnitWork();
  }

  // commit

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
  // 1. 提交自己
  // ! 这里没加判断 stateNode 是dom节点
  const { flags, stateNode } = wip;
  // 父dom节点
  // todo 不是所有fiber都有dom节点
  const parentNode = wip.return.stateNode;
  if (flags & Placement && stateNode) {
    parentNode.appendChild(stateNode);
  }

  // 2. 提交子节点
  commitWorker(wip.child);
  // 3. 提交兄弟
  commitWorker(wip.sibling);
}

import {
  updateFunctionComponent,
  updateHostComponent,
} from "./ReactFiberReconciler";
import {FunctionComponent, HostComponent} from "./ReactWorkTags";
import {Placement, Update, updateNode} from "./utils";

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
  const {tag} = wip;

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

  requestIdleCallback(workLoop);
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
  const {flags, stateNode} = wip;
  // 父dom节点
  // todo 不是所有fiber都有dom节点
  const parentNode = getParentNode(wip.return); //wip.return.stateNode;
  // 插入（初次渲染、更新移动位置）
  if (flags & Placement && stateNode) {
    parentNode.appendChild(stateNode);
  }

  if (flags & Update && stateNode) {
    updateNode(wip.stateNode, wip.alternate.props, wip.props);
  }

  // 2. 提交子节点
  commitWorker(wip.child);
  // 3. 提交兄弟
  commitWorker(wip.sibling);
}

// 有没有可能找不到
// 可能找不到0
// 一定能找到扣1
function getParentNode(wip) {
  let tem = wip;

  while (tem) {
    if (tem.stateNode) {
      return tem.stateNode;
    }
    tem = tem.return;
  }
}

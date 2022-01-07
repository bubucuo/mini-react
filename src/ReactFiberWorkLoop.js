import {
  updateHostComponent,
  updateFunctionComponent,
} from "./ReactFiberReconciler";
import {isFn, isStr, Placement, Update, updateNode} from "./utils";

let wipRoot = null;
let wip = null;

export function scheduleUpdateOnFiber(fiber) {
  fiber.alternate = {...fiber};

  wipRoot = fiber;
  wip = fiber;
}

function performUnitOfWork() {
  const {type} = wip;
  if (isStr(type)) {
    updateHostComponent(wip);
  } else if (isFn(type)) {
    updateFunctionComponent(wip);
  }

  // 2. 返回下一个任务
  // 王朝的故事 深度优先
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

  //提交
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
  // 1. 更新自己
  // vnode -》 node
  const {flags, stateNode} = wip;
  // parentNode就是父dom节点
  // fiber是不一定有dom节点
  let parentNode = getParentNode(wip.return);

  if (flags & Placement && stateNode) {
    parentNode.appendChild(stateNode);
  }

  if (flags & Update && stateNode) {
    updateNode(stateNode, wip.alternate.props, wip.props);
  }

  // 2. 更新子节点
  commitWorker(wip.child);
  // 3. 更新兄弟
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

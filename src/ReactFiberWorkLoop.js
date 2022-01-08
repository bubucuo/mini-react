import { isStr } from "./utils";

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

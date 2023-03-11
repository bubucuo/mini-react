import {ReactElement} from "shared/ReactTypes";
import {NormalPriority, NormalSchedulerPriority, Scheduler} from "scheduler";
import {createFiberFromElement} from "./ReactFiber";
import {Fiber, FiberRoot} from "./ReactInternalTypes";
import {beginWork, updateNode} from "./ReactFiberBeginWork";
import {
  HostComponent,
  HostRoot,
  HostText,
  FunctionComponent,
} from "./ReactWorkTags";
import {ChildDeletion, Placement, Update} from "./ReactFiberFlags";
import {HookLayout, HookFlags, HookPassive} from "./ReactHookEffectTags";
import {
  DefaultLane,
  getHighestPriorityLane,
  getNextLanes,
  Lane,
  Lanes,
  markRootUpdated,
  NoLane,
  NoLanes,
} from "./ReactFiberLane";
import {getCurrentTime} from "shared/utils";
import {markUpdateLaneFromFiberToRoot} from "./ReactFiberConcurrentUpdates";
import {current} from "../../../../DebugReact/src/react/packages/react-reconciler/src/ReactCurrentFiber";

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

// 记录当前处于React执行栈的哪个阶段
let executionContext: ExecutionContext = NoContext;

// current 当前的，在React中对应fiber，对应 output 的fiber
// work in progress  fiber 工作当中的、正在进行的，
let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null = null;

export function updateContainer(element: ReactElement, root: FiberRoot) {
  const current = root.current;
  const eventTime = requestEventTime();

  const lane = requestUpdateLane(current);

  root.current.child = createFiberFromElement(element, root.current);
  root.current.child.flags = Placement;
  scheduleUpdateOnFiber(root, root.current, lane, eventTime);
}

// React中的更新都会走 scheduleUpdateOnFiber， render\setState
let workInProgressRootRenderLanes: Lanes = NoLanes;

export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  lane: Lane,
  eventTime: number
) {
  // 标记 root 有一个 pending update
  markRootUpdated(root, lane, eventTime);
  // 从fiber往上层查找，给它祖先节点标记子节点有更新，即 childLanes
  markUpdateLaneFromFiberToRoot(fiber, lane);

  workInProgressRoot = root;
  workInProgress = fiber;
  workInProgressRootRenderLanes = root.pendingLanes;

  ensureRootIsScheduled(root, eventTime);
}

function ensureRootIsScheduled(root: FiberRoot, currentTime: number) {
  const existingCallbackNode = root.callbackNode;

  const nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );

  if (nextLanes === NoLanes) {
    // Special case: There's nothing to work on.
    if (existingCallbackNode !== null) {
      Scheduler.cancelCallback(existingCallbackNode);
    }
    root.callbackNode = null;
    root.callbackPriority = NoLane;
    return;
  }
  const newCallbackPriority = getHighestPriorityLane(nextLanes);

  // Schedule a new callback.
  // todo more 此时暂时使用 NormalPriority 16
  let newCallbackNode = Scheduler.scheduleCallback(
    NormalPriority,
    performConcurrentWorkOnRoot.bind(null, root)
  );

  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
}

function performConcurrentWorkOnRoot(root: FiberRoot, didTimeout) {
  let lanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );

  renderRootSync(root, lanes);

  const finishedWork: Fiber = root.current.alternate;
  root.finishedWork = finishedWork;
  root.finishedLanes = lanes;

  commitRoot(root);
}

function renderRootSync(root: FiberRoot, lanes: Lanes) {
  const prevExecutionContext = executionContext;
  executionContext |= RenderContext;

  workLoop();

  // Set this to null to indicate there's no in-progress render.
  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork: Fiber): void {
  const current = unitOfWork.alternate;

  let next = beginWork(current, workInProgress); // 1.处理fiber 2.返回子节点
  if (next === null) {
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}

// 没有子节点->找兄弟->找叔叔
function completeUnitOfWork(unitOfWork: Fiber): void {
  let completeWork: Fiber = unitOfWork;

  do {
    const siblingFiber = completeWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }
    const returnFiber = completeWork.return;
    completeWork = returnFiber;
    workInProgress = completeWork;
  } while (completeWork);
}

// todo
function commitRoot(root: FiberRoot) {
  commitMutationEffectsOnFiber(root.current.child, root);

  const rootChild = root.current.child;

  Scheduler.scheduleCallback(NormalSchedulerPriority, () => {
    flushPassiveEffect(rootChild);
    return;
  });

  workInProgressRoot = null;
  workInProgress = null;
}

function commitMutationEffectsOnFiber(finishedWork: Fiber, root: FiberRoot) {
  recursivelyTraverseMutationEffects(root, finishedWork);
  commitReconciliationEffects(finishedWork);
}

function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber
) {
  let child: Fiber = parentFiber.child;
  while (child != null) {
    commitMutationEffectsOnFiber(child, root);
    child = child.sibling;
  }
}

function commitReconciliationEffects(finishedWork: Fiber) {
  const flags = finishedWork.flags;
  if (flags & Placement) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }

  if (flags & Update) {
    switch (finishedWork.tag) {
      case HostComponent:
        if (finishedWork.stateNode) {
          updateNode(
            finishedWork.stateNode,
            finishedWork.alternate.pendingProps,
            finishedWork.pendingProps
          );
        }
        break;

      case FunctionComponent:
        commitHookEffects(finishedWork, HookLayout);
        break;
    }

    finishedWork.flags &= ~Update;
  }

  // 在dom上删除，需要父子dom节点
  // 但是不是所有fiber节点都有dom
  if (flags & ChildDeletion) {
    // parentFiber 是 deletions 的父dom节点对应的fiber
    const parentFiber = isHostParent(finishedWork)
      ? finishedWork
      : getHostParentFiber(finishedWork);
    //
    const parent = parentFiber.stateNode;
    commitDeletions(finishedWork.deletions, parent);
    finishedWork.deletions = null;
    finishedWork.flags &= ~ChildDeletion;
  }
}

function commitHookEffects(finishedWork: Fiber, hookFlags: HookFlags) {
  const updateQueue = finishedWork.updateQueue;

  const lastEffect = updateQueue != null ? updateQueue.lastEffect : null;
  if (lastEffect) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;

    do {
      if ((effect.tag & hookFlags) === hookFlags) {
        const create = effect.create;
        // effect.destory = create();
        create();
      }

      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

function flushPassiveEffect(finishedWork: Fiber) {
  recursivelyTraversePassiveMountEffects(finishedWork);
  commitHookEffects(finishedWork, HookPassive);
}

function recursivelyTraversePassiveMountEffects(parentFiber: Fiber) {
  let child: Fiber = parentFiber.child;
  while (child != null) {
    commitHookEffects(child, HookPassive);
    child = child.sibling;
  }
}

function commitDeletions(deletions: Array<Fiber>, parent: Element) {
  deletions.forEach((deletion) => {
    // 删除 deletion 对应的dom
    parent.removeChild(getStateNode(deletion));
  });
}

function getStateNode(fiber: Fiber) {
  let node = fiber;
  while (1) {
    if (isHostChild(node) && node.stateNode) {
      return node.stateNode;
    }
    node = node.child;
  }
}

// 新增插入、移动位置
// 更新
// child0->child1->child2->child3
// 寻找child0的dom节点的兄弟dom节点
function commitPlacement(finishedWork: Fiber) {
  // 获取父dom对应的fiber

  // 原生子节点
  if (finishedWork.stateNode && isHostChild(finishedWork)) {
    const parentFiber = getHostParentFiber(finishedWork);
    let parent = parentFiber.stateNode;

    if (parent.containerInfo) {
      parent = parent.containerInfo;
    }

    const before = getHostSibling(finishedWork);
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
}

// 返回 fiber 的下一个在文档流里的兄弟dom节点
function getHostSibling(fiber: Fiber) {
  let node = fiber;

  sibling: while (1) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;

    while (!isHostChild(node)) {
      if (node.flags & Placement) {
        continue sibling;
      }

      if (node.child === null) {
        continue sibling;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
}

function insertOrAppendPlacementNode(
  node: Fiber,
  before: Element,
  parent: Element
) {
  const {stateNode} = node;
  if (before) {
    parent.insertBefore(stateNode, before);
  } else {
    parent.appendChild(stateNode);
  }
}

// 获取父dom对应的fiber
function getHostParentFiber(fiber: Fiber): Fiber {
  let parent = fiber.return;

  while (parent != null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
}

function isHostParent(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

function isHostChild(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostText;
}

export function requestUpdateLane(fiber: Fiber): Lane {
  // React内部更新方法触发
  // 初次渲染的时候，这里是 0
  // setState SyncLane 1
  // const updateLane: Lane = getCurrentUpdatePriority();

  // if (updateLane !== NoLane) {
  //   return updateLane;
  // }

  // 在React外部触发
  const eventLane: Lane = DefaultLane; //(getCurrentEventPriority(): any);
  return eventLane;
}

export function requestEventTime(): number {
  return getCurrentTime();
}

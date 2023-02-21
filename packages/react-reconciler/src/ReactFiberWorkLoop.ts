import {ReactElement} from "shared/ReactTypes";
import {Fiber, FiberRoot} from "./ReactInternalTypes";
import {NormalSchedulerPriority, Scheduler} from "scheduler";
import {beginWork} from "./ReactFiberBeginWork";
import {createFiberFromElement} from "./ReactFiber";
import {Placement} from "./ReactFiberFlags";
import {
  HostComponent,
  HostRoot,
  HostText,
  FunctionComponent,
} from "./ReactWorkTags";

// The root we're working on
let workInProgressRoot: FiberRoot | null = null;
// The fiber we're working on
let workInProgress: Fiber | null = null;

export function updateContainer(element: ReactElement, root: FiberRoot) {
  root.current.child = createFiberFromElement(element, root.current);

  scheduleUpdateOnFiber(root, root.current);
}

export function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
  workInProgressRoot = root;
  workInProgress = fiber;

  Scheduler.scheduleCallback(NormalSchedulerPriority, workLoop);

  console.log(
    "%c [  ]-22",
    "font-size:13px; background:pink; color:#bf2c9f;",
    workInProgressRoot
  );
}

// 王朝的故事
function performUnitOfWork(unitOfWork: Fiber): void {
  const current = unitOfWork.alternate;
  let next = beginWork(current, workInProgress);
  // unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next == null) {
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork: Fiber): void {
  let completedWork: Fiber = unitOfWork;

  do {
    const siblingFiber = completedWork.sibling;
    const returnFiber = completedWork.return;

    if (siblingFiber !== null) {
      // If there is more work to do in this returnFiber, do that next.
      workInProgress = siblingFiber;
      return;
    }
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork);
}

function workLoop() {
  while (workInProgress) {
    performUnitOfWork(workInProgress);
  }

  if (!workInProgress && workInProgressRoot) {
    commitRoot();
  }
}

function commitRoot() {
  workInProgressRoot.containerInfo.append(
    workInProgressRoot.current.child.stateNode
  );

  commitMutationEffectsOnFiber(
    workInProgressRoot.current.child,
    workInProgressRoot
  );
  workInProgressRoot = null;
  workInProgress = null;
}

function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber
) {
  let child = parentFiber.child;
  while (child != null) {
    commitMutationEffectsOnFiber(child, root);
    child = child.sibling;
  }
}

function commitMutationEffectsOnFiber(finishedWork: Fiber, root: FiberRoot) {
  switch (finishedWork.tag) {
    case HostComponent:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      return;

    case FunctionComponent:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      return;
  }
}

function commitReconciliationEffects(finishedWork: Fiber) {
  const flags = finishedWork.flags;
  if (flags & Placement) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }
}

function commitPlacement(finishedWork: Fiber) {
  const parentFiber = getHostParentFiber(finishedWork);

  switch (parentFiber.tag) {
    case HostComponent: {
      const parent = parentFiber.stateNode;

      const before = getHostSibling(finishedWork);
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
  }
}

function insertOrAppendPlacementNode(node: Fiber, before, parent): void {
  const {tag} = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const stateNode = node.stateNode;
    if (before) {
      parent.insertBefore(stateNode, before);
    } else {
      parent.appendChild(stateNode);
    }
  } else {
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

function getHostParentFiber(fiber: Fiber): Fiber {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }

  throw new Error(
    "Expected to find a host parent. This error is likely caused by a bug " +
      "in React. Please file an issue."
  );
}

function isHostParent(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

function getHostSibling(fiber: Fiber) {
  // We're going to search forward into the tree until we find a sibling host
  // node. Unfortunately, if multiple insertions are done in a row we have to
  // search past them. This leads to exponential search for the next sibling.
  // TODO: Find a more efficient way to do this.
  let node: Fiber = fiber;
  siblings: while (true) {
    // If we didn't find anything, let's try the next sibling.
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        // If we pop out of the root or hit the parent the fiber we are the
        // last sibling.
        return null;
      }
      // $FlowFixMe[incompatible-type] found when upgrading Flow
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
    while (node.tag !== HostComponent && node.tag !== HostText) {
      // If it is not host node and, we might have a host node inside it.
      // Try to search down until we find one.
      if (node.flags & Placement) {
        // If we don't have a child, try the siblings instead.
        continue siblings;
      }
      // If we don't have a child, try the siblings instead.
      // We also skip portals because they are not part of this host tree.
      if (node.child === null) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    // Check if this host node is stable or about to be placed.
    if (!(node.flags & Placement)) {
      // Found it!
      return node.stateNode;
    }
  }
}

// todo
// 更新
// Hooks
// 协调
// 事件
// 类组件

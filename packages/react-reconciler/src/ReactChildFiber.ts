import {isStr} from "shared/utils";
import {createFiberFromElement, createFiberFromText} from "./ReactFiber";
import {Placement, Update} from "./ReactFiberFlags";
import {Fiber} from "./ReactInternalTypes";

// 删除单个节点
function deleteChild(returnFiber: Fiber, childToDelete: Fiber) {
  const deletions = returnFiber.deletions;
  if (deletions) {
    returnFiber.deletions.push(childToDelete);
  } else {
    returnFiber.deletions = [childToDelete];
  }
}

function deleteRemainingChildren(returnFiber: Fiber, currentFirstChild: Fiber) {
  let childToDelete = currentFirstChild;

  while (childToDelete) {
    deleteChild(returnFiber, childToDelete);
    childToDelete = childToDelete.sibling;
  }
}

function mapRemainingChildren(currentFirstChild: Fiber) {
  const existingChildren = new Map();

  let existingChild = currentFirstChild;
  while (existingChild) {
    // key: value
    // key||index: fiber
    existingChildren.set(
      existingChild.key || existingChild.index,
      existingChild
    );
    existingChild = existingChild.sibling;
  }

  return existingChildren;
}

// 记录newFiber的位置
// 判断节点是否发生位移
function placeChild(
  newFiber: Fiber,
  lastPlacedIndex: number,
  newIndex: number,
  shouldTrackSideEffects: boolean
): number {
  newFiber.index = newIndex;
  if (!shouldTrackSideEffects) {
    // 初次渲染
    return lastPlacedIndex;
  }

  const current = newFiber.alternate;
  if (current) {
    // 节点更新
    const oldIndex = current.index;
    if (oldIndex < lastPlacedIndex) {
      // 相对位置发生变化，需要发生位置移动，appendChild或者insertBefore
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    } else {
      return oldIndex;
    }
  } else {
    // 新增插入
    newFiber.flags |= Placement;
    return lastPlacedIndex;
  }
}

// 初次渲染
// 更新
export function reconcileChildren(
  current: Fiber | null,
  returnFiber: Fiber,
  nextChildren: any // 数组、对象、文本
): Fiber | null {
  console.log("%c [  ]-83", "font-size:13px; background:pink; color:#bf2c9f;");
  const newChildren = Array.isArray(nextChildren)
    ? nextChildren
    : [nextChildren];

  let newIndex = 0;
  let resultingFirstChild = null;
  let previousNewFiber = null;
  let oldFiber = returnFiber.alternate?.child;
  let nextOldFiber = null; //暂存oldFiber

  // 记录上次节点插入的位置，判断节点位置是否发生变化
  let lastPlacedIndex = 0;

  // 是否是组件更新
  const shouldTrackSideEffects = !!returnFiber.alternate;

  // *1. 从左边往右遍历，比较新老节点，如果节点可以复用，继续往右，否则就停止
  for (; oldFiber && newIndex < newChildren.length; newIndex++) {
    const newChild = newChildren[newIndex];
    if (newChild == null) {
      continue;
    }

    if (oldFiber.index > newIndex) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }

    if (!sameNode(newChild, oldFiber)) {
      if (oldFiber === null) {
        oldFiber = nextOldFiber;
      }
      break;
    }

    let newFiber: Fiber;
    if (isStr(newChild)) {
      newFiber = createFiberFromText(newChild, returnFiber);
    } else {
      newFiber = createFiberFromElement(newChild, returnFiber);
    }

    lastPlacedIndex = placeChild(
      newFiber,
      lastPlacedIndex,
      newIndex,
      shouldTrackSideEffects
    );

    Object.assign(newFiber, {
      stateNode: oldFiber.stateNode,
      alternate: oldFiber,
      flags: Update,
    });
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
    oldFiber = nextOldFiber;
  }

  // *2. 新节点没了，（老节点还有）。则删除剩余的老节点即可
  if (newIndex === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }

  // * 3.(新节点还有)，老节点没了
  if (!oldFiber) {
    for (; newIndex < newChildren.length; newIndex++) {
      const newChild = newChildren[newIndex];
      if (newChild == null) {
        continue;
      }

      let newFiber: Fiber;
      if (isStr(newChild)) {
        newFiber = createFiberFromText(newChild, returnFiber);
      } else {
        newFiber = createFiberFromElement(newChild, returnFiber);
      }
      newFiber.flags = Placement;

      lastPlacedIndex = placeChild(
        newFiber,
        lastPlacedIndex,
        newIndex,
        shouldTrackSideEffects
      );

      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
  }

  // *4. 新老节点都还有节点，但是因为老fiber是链表，不方便快速get与delete，
  // *   因此把老fiber链表中的节点放入Map中，后续操作这个Map的get与delete

  const existingChildren = mapRemainingChildren(oldFiber);
  for (; newIndex < newChildren.length; newIndex++) {
    const newChild = newChildren[newIndex];
    if (newChild == null) {
      continue;
    }

    let newFiber: Fiber;
    if (isStr(newChild)) {
      newFiber = createFiberFromText(newChild, returnFiber);
    } else {
      newFiber = createFiberFromElement(newChild, returnFiber);
    }

    const matchedFiber = existingChildren.get(newFiber.key || newIndex);

    if (matchedFiber) {
      Object.assign(newFiber, {
        stateNode: matchedFiber.stateNode,
        alternate: matchedFiber,
        flags: Update,
      });
      existingChildren.delete(newFiber.key || newIndex);
    } else {
      newFiber.flags = Placement;
    }

    lastPlacedIndex = placeChild(
      newFiber,
      lastPlacedIndex,
      newIndex,
      shouldTrackSideEffects
    );

    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
  }

  // *5. 如果是组件更新阶段，此时新节点已经遍历完了，能复用的老节点都用完了，
  // * 则最后查找Map里是否还有元素，如果有，则证明是新节点里不能复用的，也就是要被删除的元素，此时删除这些元素就可以了
  if (shouldTrackSideEffects) {
    existingChildren.forEach((child) => deleteChild(returnFiber, child));
  }

  return resultingFirstChild;
}

function sameNode(a, b) {
  return a.type === b.type && a.key === b.key;
}

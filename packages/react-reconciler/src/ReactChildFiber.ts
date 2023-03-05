import {isStr} from "shared/utils";
import {createFiberFromElement, createFiberFromText} from "./ReactFiber";
import {Fiber} from "./ReactInternalTypes";
import {Placement, Update} from "./ReactFiberFlags";

function placeChild(
  newFiber: Fiber,
  lastPlacedIndex: number,
  newIndex: number,
  shouldTrackSideEffects: boolean
) {
  newFiber.index = newIndex;
  if (!shouldTrackSideEffects) {
    // 初次渲染，不会有节点发生相对位置变化
    return;
  }
  // 获取老fiber
  const current = newFiber.alternate;

  if (current) {
    // 节点更新
    const oldIndex = current.index;
    if (oldIndex < lastPlacedIndex) {
      // 相对位置变化，需要移动位置
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    } else {
      return oldIndex;
    }
  } else {
    // 没有老fiber，证明这个节点是新插入的
    newFiber.flags |= Placement;
    return lastPlacedIndex;
  }
}

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

// 协调子节点
// 返回 child ,第一个子fiber
// diff

// 节点复用，必须同时满足三个条件：

// 同一层级下、相同类型、相同key

// 实际上：位置的移动

// 老节点 element: 多个子节点时候，是数组

// 新节点children ：fiber，单链表

export function reconcileChildren(
  current: Fiber | null,
  returnFiber: Fiber,
  nextChildren: any // 对象、数组、字符串
) {
  const newChildren = Array.isArray(nextChildren)
    ? nextChildren
    : [nextChildren];

  let newIndex = 0;
  let resultingFirstChild = null;
  let previousNewFiber = null;

  // 记录上次 fiber 插入的位置
  // 上次插入fiber的位置是 10， 新fiber的位置是 3，相对位置变化，需要移动节点
  let lastPlacedIndex = 0;

  // 老fiber的子节点的头结点
  let oldFiber = returnFiber.alternate?.child;
  // 暂时存储下一个fiber
  let nextOldFiber = null;

  // 是否是更新
  let shouldTrackSideEffects = !!returnFiber.alternate;

  // 实现协调算法，考虑初次渲染和更新
  // 更新
  // *1. 从左往右遍历，比较新老节点，如果节点可以复用就复用，不能就break
  // 更新的时候，大部分节点都是待在原来的顺序
  for (; oldFiber && newIndex < newChildren.length; newIndex++) {
    const newChild = newChildren[newIndex];
    if (newChild == null) {
      continue;
    }

    // 按照顺序比较新老节点
    if (oldFiber.index > newIndex) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }

    const same = sameNode(newChild, oldFiber);
    if (!same) {
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
      // newFiber 是第0个fiber
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }

    previousNewFiber = newFiber;
    oldFiber = nextOldFiber;
  }

  // *2. 新节点没了，剩下的老节点删除就行了
  if (newIndex === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }

  // *3.老节点没了，新节点要做新增
  // 初次渲染,
  // 更新的时候：老fiber有1个，新节点有10个
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
        // newFiber 是第0个fiber
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }

      previousNewFiber = newFiber;
    }
  }

  // *4 新老节点都还有
  // 乱序

  // Map | 哈希表
  // 把 老fiber单链表创建一个哈希表
  const existingChildren = mapRemainingChildren(oldFiber);
  for (; newIndex < newChildren.length; newIndex++) {
    const newChild = newChildren[newIndex];
    if (newChild === null) {
      continue;
    }

    let newFiber: Fiber;
    if (isStr(newChild)) {
      newFiber = createFiberFromText(newChild, returnFiber);
    } else {
      newFiber = createFiberFromElement(newChild, returnFiber);
    }

    const matchedFiber = existingChildren.get(newChild.key || newIndex);

    if (matchedFiber) {
      // 可以复用节点
      Object.assign(newFiber, {
        stateNode: matchedFiber.stateNode,
        alternate: matchedFiber,
        flags: Update,
      });

      existingChildren.delete(newChild.key || newIndex);
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
      // newFiber 是第0个fiber
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }

    previousNewFiber = newFiber;
  }

  // *5 哈希表里如果还有值，还有多余的老节点，那就删除剩余的老fiber
  if (shouldTrackSideEffects) {
    existingChildren.forEach((child) => deleteChild(returnFiber, child));
  }

  // 返回头结点
  return resultingFirstChild;
}

function sameNode(a, b) {
  return a.type === b.type && a.key === b.key;
}

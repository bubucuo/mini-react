import { createFiber } from "./ReactFiber";
import { isArray, isStringOrNumber, Placement, Update } from "./utils";

// returnFiber.deletions = [a,b,c]
function deleteChild(returnFiber, childToDelete) {
  const deletions = returnFiber.deletions;
  if (deletions) {
    returnFiber.deletions.push(childToDelete);
  } else {
    returnFiber.deletions = [childToDelete];
  }
}

function deleteRemainingChildren(returnFiber, currentFirstChild) {
  let childToDelete = currentFirstChild;

  while (childToDelete) {
    deleteChild(returnFiber, childToDelete);
    childToDelete = childToDelete.sibling;
  }
}

function placeChild(
  newFiber,
  lastPlacedIndex,
  newIndex,
  shouldTrackSideEffects
) {
  newFiber.index = newFiber;
  if (!shouldTrackSideEffects) {
    // 初次渲染
    return lastPlacedIndex;
  }
}

// 协调（diff）
// abc
// bc

export function reconcileChildren(returnFiber, children) {
  if (isStringOrNumber(children)) {
    return;
  }

  const newChildren = isArray(children) ? children : [children];
  // oldfiber的头结点
  let oldFiber = returnFiber.alternate?.child;

  // 更新true，初次渲染是false
  let shouldTrackSideEffects = !!returnFiber.alternate;

  let previousNewFiber = null;
  let newIndex = 0;
  // 上次插入节点的位置
  let lastPlacedIndex = 0;

  if (!oldFiber) {
    // 初次渲染
    for (; newIndex < newChildren.length; newIndex++) {
      const newChild = newChildren[newIndex];
      if (newChild == null) {
        continue;
      }
      const newFiber = createFiber(newChild, returnFiber);

      lastPlacedIndex = placeChild(
        newFiber,
        lastPlacedIndex,
        newIndex,
        shouldTrackSideEffects
      );

      if (previousNewFiber === null) {
        // head node
        returnFiber.child = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }

      previousNewFiber = newFiber;
    }

    return;
  }

  //   for (newIndex = 0; newIndex < newChildren.length; newIndex++) {
  //     const newChild = newChildren[newIndex];
  //     if (newChild == null) {
  //       continue;
  //     }
  //     const newFiber = createFiber(newChild, returnFiber);
  //     const same = sameNode(newFiber, oldFiber);

  //     if (same) {
  //       Object.assign(newFiber, {
  //         stateNode: oldFiber.stateNode,
  //         alternate: oldFiber,
  //         flags: Update,
  //       });
  //     }

  //     if (!same && oldFiber) {
  //       deleteChild(returnFiber, oldFiber);
  //     }

  //     console.log("newfiber", newFiber); //sy-log

  //     if (oldFiber) {
  //       oldFiber = oldFiber.sibling;
  //     }

  //     if (previousNewFiber === null) {
  //       // head node
  //       returnFiber.child = newFiber;
  //     } else {
  //       previousNewFiber.sibling = newFiber;
  //     }

  //     previousNewFiber = newFiber;
  //   }

  // 如果新节点遍历完了，但是(多个)老节点还有，（多个）老节点要被删除
  if (newIndex === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber);
    return;
  }
}

// 节点复用的条件：1. 同一层级下 2. 类型相同 3. key相同
function sameNode(a, b) {
  return a && b && a.type === b.type && a.key === b.key;
}

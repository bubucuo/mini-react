// 返回最小堆堆顶元素
export function peek(heap) {
  return heap.length === 0 ? null : heap[0];
}

// 往最小堆中插入元素
// 1. 把node插入数组尾部
// 2. 往上调整最小堆
export function push(heap, node) {
  let index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}

function siftUp(heap, node, i) {
  let index = i;

  while (index > 0) {
    const parentIndex = (index - 1) >> 1;
    const parent = heap[parentIndex];
    if (compare(parent, node) > 0) {
      // parent>node， 不符合最小堆条件
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      return;
    }
  }
}

// 删除堆顶元素
// 1. 最后一个元素覆盖堆顶
// 2. 向下调整
export function pop(heap) {
  if (heap.length === 0) {
    return null;
  }
  const fisrt = heap[0];
  const last = heap.pop();

  if (fisrt !== last) {
    heap[0] = last;
    siftDown(heap, last, 0);
  }

  return fisrt;
}

function siftDown(heap, node, i) {
  let index = i;
  const len = heap.length;
  const halfLen = len >> 1;
  while (index < halfLen) {
    const leftIndex = (index + 1) * 2 - 1;
    const rightIndex = leftIndex + 1;
    const left = heap[leftIndex];
    const right = heap[rightIndex];

    if (compare(left, node) < 0) {
      // left < node,
      // ? left、right
      if (rightIndex < len && compare(right, left) < 0) {
        // right 最小， 交换right和parent
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        // 没有right或者left<right
        // 交换left和parent
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (rightIndex < len && compare(right, node) < 0) {
      // right 最小， 交换right和parent
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      // parent最小
      return;
    }
  }
}

function compare(a, b) {
  //   return a - b;
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}

// const a = [3, 7, 4, 10, 12, 9, 6, 15, 14];

// push(a, 8);

// while (1) {
//   if (a.length === 0) {
//     break;
//   }
//   console.log("a", peek(a)); //sy-log
//   pop(a);
// }

export function peek(heap) {
  return heap.length === 0 ? null : heap[0];
}

// 1. 把node添加到数组中
// 2. 往上调整最小堆（比较子节点和父节点谁最小，如果父节点不是最小，则交换位置，并继续往上调整）
export function push(heap, node) {
  const len = heap.length;
  heap.push(node);
  siftUp(heap, node, len);
}

// 向上调整最小堆
function siftUp(heap, node, i) {
  let index = i;
  while (index > 0) {
    const parentIndex = (index - 1) >>> 1;
    const parent = heap[parentIndex];
    if (compare(parent, node) > 0) {
      // parnet>node, 不符合最小堆
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      return;
    }
  }
}

// 1. 扔第一个元素出来
// 2. 把剩下的元素调整成最小堆，
export function pop(heap) {
  if (heap.length === 0) {
    return null;
  }
  const first = heap[0];
  const last = heap.pop();
  if (first !== last) {
    heap[0] = last;
    siftDown(heap, last, 0);
  }

  return first;
}

function siftDown(heap, node, i) {
  let index = i;
  const len = heap.length;
  const halfLen = len >>> 1;

  while (index < halfLen) {
    let leftIndex = (index + 1) * 2 - 1;
    let left = heap[leftIndex];
    let rightIndex = leftIndex + 1;
    let right = heap[rightIndex];
    // todo 比较parent与left与right的大小
    // 如果parent不是最小的，那就比较left和right谁最小，然后把最小的和parent交换位置
    // 如果parent是最小的，那就停止
    if (compare(left, node) < 0) {
      // left < parent
      // 为了保证根节点最小，比较left和right
      if (rightIndex < len && compare(right, left) < 0) {
        // right<left, right是最小的，交换parent和right
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        // right>left, left是最小的，交换parent和left
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (rightIndex < len && compare(right, node) < 0) {
      // left > parent
      //   检查right, right<parent
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      // parnent最小
      return;
    }
  }
}

function compare(a, b) {
  return a - b;
  // Compare sort index first, then task id.
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}

function minHeap() {}

// const a = [3, 7, 4, 10, 12, 9, 6, 15, 14];

// // push(a, 8);

// while (1) {
//   if (a.length === 0) {
//     break;
//   }
//   console.log("a", peek(a)); //sy-log
//   pop(a);
// }

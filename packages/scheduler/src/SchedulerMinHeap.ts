export type Node = {
  id: number; // 节点的唯一值, 越小进入最小堆的时间越早
  sortIndex: number; // 用于排序的索引
};

// 最小堆
export type Heap<T extends Node> = Array<T>;

// 查询堆顶元素
export function peek<T extends Node>(heap: Heap<T>): T | null {
  return heap.length === 0 ? null : heap[0];
}

// 插入元素
// 往最小堆中插入，注意插入元素之后会破坏最小堆的结构，所以还要调整成最小堆
export function push<T extends Node>(heap: Heap<T>, node: T): void {
  const index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}

function siftUp<T extends Node>(heap: Heap<T>, node: T, i: number): void {
  let index = i;
  while (index > 0) {
    const parentIndex = (index - 1) >>> 1; // 获取父节点的索引
    const parent = heap[parentIndex];
    if (compare(parent, node) > 0) {
      // 父节点更大，交换父子节点
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex; // 更新索引到父节点位置，继续向上调整
    } else {
      return; // 父节点更小，满足最小堆的结构，停止即可
    }
  }
}
// 删除对顶元素
// 最小堆是受限的数据结构，只能删除堆顶元素，不能删除其他元素
export function pop<T extends Node>(heap: Heap<T>): T | null {
  if (heap.length === 0) {
    return null; // 如果堆为空，返回 null
  }
  const first = heap[0]; // 获取堆顶元素
  const last = heap.pop(); // 取最后一个元素
  if (last !== undefined && first !== last) {
    // 最小堆有>=2个元素时
    heap[0] = last; // 将最后一个元素放到堆顶
    siftDown(heap, last, 0); // 调整堆结构
  }
  return first; // 返回被删除的堆顶元素
}

function siftDown<T extends Node>(heap: Heap<T>, node: T, i: number): void {
  let index = i;
  const length = heap.length;
  const halfLength = length >>> 1; // 计算堆的半长度
  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1; // 左子节点的索引
    const rightIndex = leftIndex + 1; // 右子节点的索引
    const left = heap[leftIndex];
    const right = heap[rightIndex];

    if (compare(left, node) < 0) {
      if (rightIndex < length && compare(right, left) < 0) {
        // 如果右子节点存在, 且更小，交换
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex; // 更新索引到右子节点位置
      } else {
        // 如果左子节点更小，交换
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex; // 更新索引到左子节点位置
      }
    } else if (rightIndex < length && compare(right, node) < 0) {
      // 如果左子节点更大，且右子节点更小，交换
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex; // 更新索引到右子节点位置
    } else {
      // 如果根节点不大于左右子节点，满足最小堆的结构，停止调整
      return;
    }
  }
}

function compare(a: Node, b: Node) {
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id; // 如果 sortIndex 相同，则比较 id
}

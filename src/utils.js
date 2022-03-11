// ! flags
export const NoFlags = /*                      */ 0b00000000000000000000;

// 新增、插入
export const Placement = /*                    */ 0b0000000000000000000010; // 2
// 节点更新属性
export const Update = /*                       */ 0b0000000000000000000100; // 4
// 删除
export const Deletion = /*                     */ 0b0000000000000000001000; // 8

export function isStr(s) {
  return typeof s === "string";
}

export function isStringOrNumber(s) {
  return typeof s === "string" || typeof s === "number";
}

export function isFn(fn) {
  return typeof fn === "function";
}

export function isArray(arr) {
  return Array.isArray(arr);
}

export function isUndefined(s) {
  return s === undefined;
}

export function updateNode(node, nextVal) {
  Object.keys(nextVal).forEach((k) => {
    if (k === "children") {
      if (isStringOrNumber(nextVal[k])) {
        node.textContent = nextVal[k];
      }
    } else {
      node[k] = nextVal[k];
    }
  });
}

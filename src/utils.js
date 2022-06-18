// ! flags
export const NoFlags = /*                      */ 0b00000000000000000000;

// 新增、插入
export const Placement = /*                    */ 0b0000000000000000000010; // 2
// 节点更新属性
export const Update = /*                       */ 0b0000000000000000000100; // 4

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

// {id: 'red'}
// {className:'green}
// fake 合成事件
export function updateNode(node, prevVal, nextVal) {
  // 遍历老属性
  Object.keys(prevVal).forEach((k) => {
    if (k === "children") {
      if (isStringOrNumber(nextVal[k])) {
        node.textContent = "";
      }
    } else if (k.slice(0, 2) === "on") {
      const eventName = k.slice(2).toLocaleLowerCase();
      node.removeEventListener(eventName, prevVal[k]);
    } else {
      if (!(k in nextVal)) {
        node[k] = "";
      }
    }
  });

  Object.keys(nextVal).forEach((k) => {
    if (k === "children") {
      if (isStringOrNumber(nextVal[k])) {
        node.textContent = nextVal[k];
      }
    } else if (k.slice(0, 2) === "on") {
      const eventName = k.slice(2).toLocaleLowerCase();
      node.addEventListener(eventName, nextVal[k]);
    } else {
      node[k] = nextVal[k];
    }
  });
}

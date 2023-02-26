export type Flags = number;

export const NoFlags = /*                      */ 0b000000000000000000000000;
// 节点的新增插入|移动位置
export const Placement = /*                    */ 0b000000000000000000000010;
// 更新，节点属性的变化
export const Update = /*                       */ 0b000000000000000000000100;
export const ChildDeletion = /*                */ 0b00000000000000000000001000;
export const ContentReset = /*                 */ 0b00000000000000000000010000;

// These are not really side effects, but we still reuse this field.
export const Incomplete = /*                   */ 0b00000000000100000000000000;
export const Forked = /*                       */ 0b00000010000000000000000000;

import {describe, expect, it} from "vitest";
import {peek, push, pop, Heap, Node} from "../src/SchedulerMinHeap";

function createNode(val: number): Node {
  return {sortIndex: val, id: val};
}

describe("test min heap", () => {
  it("empty heap return null", () => {
    const tasks: Heap = [];
    expect(peek(tasks)).toBe(null);
  });

  it("heap length === 1", () => {
    const tasks: Heap = [createNode(1)];
    expect(peek(tasks)).toEqual(createNode(1));
  });

  it("heap length === 1", () => {
    const tasks: Heap = [createNode(1)];
    push(tasks, createNode(2));
    push(tasks, createNode(3));
    expect(peek(tasks)).toEqual(createNode(1));
    push(tasks, createNode(0));
    expect(peek(tasks)).toEqual(createNode(0));
    pop(tasks);
    expect(peek(tasks)).toEqual(createNode(1));
  });
});

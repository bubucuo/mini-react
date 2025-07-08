import { peek, push, pop, type Heap, type Node } from "../SchedulerMinHeap";

let idCounter = 0;
type Task = Node & {
  name: string;
};

function createTask({
  sortIndex,
  name,
}: Pick<Task, "sortIndex" | "name">): Task {
  return { id: idCounter++, sortIndex, name };
}

describe("test min heap", () => {
  it("should return null on peek/pop when empty", () => {
    const heap: Task[] = [];
    expect(peek(heap)).toBeNull();
    expect(pop(heap)).toBeNull();
  });

  it("should return the only element when heap length === 1", () => {
    const heap: Heap<Task> = [createTask({ sortIndex: 0, name: "Task A" })];
    expect(peek(heap)?.name).toEqual("Task A");
  });

  it("should push and peek correctly", () => {
    const heap: Heap<Task> = [];

    push(heap, createTask({ sortIndex: 1, name: "Task A" }));
    push(heap, createTask({ sortIndex: 9, name: "Task B" }));
    expect(peek(heap)?.name).toEqual("Task A");
    expect(peek(heap)?.name).toEqual("Task A");
  });

  it("should maintain heap order on push and pop", () => {
    const heap: Heap<Task> = [];

    push(heap, createTask({ sortIndex: 30, name: "A" }));
    push(heap, createTask({ sortIndex: 1, name: "B" }));
    push(heap, createTask({ sortIndex: 20, name: "C" }));
    push(heap, createTask({ sortIndex: 10, name: "D" }));

    const poppedOrder = [pop(heap), pop(heap), pop(heap), pop(heap)];

    const names = poppedOrder.map((t) => {
      if (!t) throw new Error("Unexpected null in poppedOrder");
      return t.name;
    });

    expect(names).toEqual(["B", "D", "C", "A"]);
  });

  it("should return null after all items popped", () => {
    const heap: Heap<Task> = [];

    push(heap, createTask({ sortIndex: 5, name: "T" }));
    pop(heap);
    expect(pop(heap)).toBeNull();
  });
});

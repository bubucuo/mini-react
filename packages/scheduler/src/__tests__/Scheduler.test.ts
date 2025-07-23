import {
  unstable_scheduleCallback as scheduleCallback,
  NormalPriority,
  UserBlockingPriority,
  ImmediatePriority,
} from "../..";

describe("任务", () => {
  it("2个相同优先级的任务，先执行先到达的任务", () => {
    let eventTasks = [];

    scheduleCallback(NormalPriority, () => {
      eventTasks.push("Task1");

      expect(eventTasks).toEqual(["Task1"]);
    });

    scheduleCallback(NormalPriority, () => {
      eventTasks.push("Task2");
      expect(eventTasks).toEqual(["Task1", "Task2"]);
    });
  });

  it("3个不同优先级的任务", () => {
    let eventTasks = [];

    scheduleCallback(NormalPriority, () => {
      eventTasks.push("Task1");
      expect(eventTasks).toEqual(["Task3", "Task2", "Task1"]);
    });

    scheduleCallback(UserBlockingPriority, () => {
      eventTasks.push("Task2");
      expect(eventTasks).toEqual(["Task3", "Task2"]);
    });

    scheduleCallback(ImmediatePriority, () => {
      eventTasks.push("Task3");
      expect(eventTasks).toEqual(["Task3"]);
    });
  });

  it("有delay的任务", () => {
    let eventTasks = [];

    scheduleCallback(NormalPriority, () => {
      eventTasks.push("Task1");
      expect(eventTasks).toEqual(["Task3", "Task1"]);
    });

    scheduleCallback(
      UserBlockingPriority,
      () => {
        eventTasks.push("Task2");
        expect(eventTasks).toEqual(["Task3", "Task1", "Task2"]);
      },
      { delay: 100000 }
    );

    scheduleCallback(ImmediatePriority, () => {
      eventTasks.push("Task3");
      expect(eventTasks).toEqual(["Task3"]);
    });
  });

  it("4个不同优先级的任务", () => {
    let eventTasks = [];

    scheduleCallback(NormalPriority, () => {
      eventTasks.push("Task1");
      expect(eventTasks).toEqual(["Task3", "Task2", "Task1"]);
    });

    scheduleCallback(UserBlockingPriority, () => {
      eventTasks.push("Task2");
      expect(eventTasks).toEqual(["Task3", "Task2"]);
    });

    scheduleCallback(ImmediatePriority, () => {
      eventTasks.push("Task3");
      expect(eventTasks).toEqual(["Task3"]);
    });

    scheduleCallback(NormalPriority, () => {
      eventTasks.push("Task4");

      expect(eventTasks).toEqual(["Task3", "Task2", "Task1", "Task4"]);
    });
  });
});

import {beforeEach, describe, expect, test, afterEach, it} from "vitest";
import * as Scheduler from "scheduler";


// let Scheduler;
let runtime;
let performance;
let cancelCallback;
let scheduleCallback;
let requestPaint;
let requestYield;
let shouldYield;
let NormalPriority;

// The Scheduler implementation uses browser APIs like `MessageChannel` and
// `setTimeout` to schedule work on the main thread. Most of our tests treat
// these as implementation details; however, the sequence and timing of these
// APIs are not precisely specified, and can vary across browsers.
//
// To prevent regressions, we need the ability to simulate specific edge cases
// that we may encounter in various browsers.
//
// This test suite mocks all browser methods used in our implementation. It
// assumes as little as possible about the order and timing of events.
describe("SchedulerBrowser", () => {
  function installMockBrowserRuntime() {
    let hasPendingMessageEvent = false;
    let isFiringMessageEvent = false;
    let hasPendingDiscreteEvent = false;
    let hasPendingContinuousEvent = false;

    let timerIDCounter = 0;
    // let timerIDs = new Map();

    let eventLog = [];

    let currentTime = 0;

    global.performance = {
      now() {
        return currentTime;
      },
    };

    // Delete node provide setImmediate so we fall through to MessageChannel.
    delete global.setImmediate;

    global.setTimeout = (cb, delay) => {
      const id = timerIDCounter++;
      log(`Set Timer`);
      // TODO
      return id;
    };
    global.clearTimeout = (id) => {
      // TODO
    };

    const port1 = {};
    const port2 = {
      postMessage() {
        if (hasPendingMessageEvent) {
          throw Error("Message event already scheduled");
        }
        log("Post Message");
        hasPendingMessageEvent = true;
      },
    };
    global.MessageChannel = function MessageChannel() {
      this.port1 = port1;
      this.port2 = port2;
    };

    const scheduling = {
      isInputPending(options) {
        if (this !== scheduling) {
          throw new Error(
            "isInputPending called with incorrect `this` context"
          );
        }

        return (
          hasPendingDiscreteEvent ||
          (options && options.includeContinuous && hasPendingContinuousEvent)
        );
      },
    };

    global.navigator = {scheduling};

    function ensureLogIsEmpty() {
      if (eventLog.length !== 0) {
        throw Error("Log is not empty. Call assertLog before continuing.");
      }
    }
    function advanceTime(ms) {
      currentTime += ms;
    }
    function resetTime() {
      currentTime = 0;
    }
    function fireMessageEvent() {
      ensureLogIsEmpty();
      if (!hasPendingMessageEvent) {
        throw Error("No message event was scheduled");
      }
      hasPendingMessageEvent = false;
      const onMessage = port1.onmessage;
      log("Message Event");

      isFiringMessageEvent = true;
      try {
        onMessage();
      } finally {
        isFiringMessageEvent = false;
        if (hasPendingDiscreteEvent) {
          log("Discrete Event");
          hasPendingDiscreteEvent = false;
        }
        if (hasPendingContinuousEvent) {
          log("Continuous Event");
          hasPendingContinuousEvent = false;
        }
      }
    }
    function scheduleDiscreteEvent() {
      if (isFiringMessageEvent) {
        hasPendingDiscreteEvent = true;
      } else {
        log("Discrete Event");
      }
    }
    function scheduleContinuousEvent() {
      if (isFiringMessageEvent) {
        hasPendingContinuousEvent = true;
      } else {
        log("Continuous Event");
      }
    }
    function log(val) {
      eventLog.push(val);
    }
    function isLogEmpty() {
      return eventLog.length === 0;
    }
    function assertLog(expected) {
      const actual = eventLog;
      eventLog = [];
      expect(actual).toEqual(expected);
    }
    return {
      advanceTime,
      resetTime,
      fireMessageEvent,
      log,
      isLogEmpty,
      assertLog,
      scheduleDiscreteEvent,
      scheduleContinuousEvent,
    };
  }

  beforeEach(() => {
    // jest.resetModules();
    runtime = installMockBrowserRuntime();

    console.log(
      "%c [  ]-186",
      "font-size:13px; background:pink; color:#bf2c9f;",
      runtime
    );

    // jest.unmock("scheduler");

    performance = global.performance;
    // Scheduler = require("scheduler");


    cancelCallback = Scheduler.unstable_cancelCallback;
    scheduleCallback = Scheduler.unstable_scheduleCallback;
    NormalPriority = Scheduler.unstable_NormalPriority;
    requestPaint = Scheduler.unstable_requestPaint;
    requestYield = Scheduler.unstable_requestYield;
    shouldYield = Scheduler.unstable_shouldYield;
  });

  afterEach(() => {
    // delete global.performance;

    console.log(
      "%c [  ]-187",
      "font-size:13px; background:pink; color:#bf2c9f;",
      runtime
    );

    if (!runtime.isLogEmpty()) {
      throw Error("Test exited without clearing log.");
    }
  });

  it("task that finishes before deadline", () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log("Task");
    });
    runtime.assertLog(["Post Message"]);
    runtime.fireMessageEvent();
    runtime.assertLog(["Message Event", "Task"]);
  });
});

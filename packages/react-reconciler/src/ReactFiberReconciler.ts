import {ReactNodeList} from "../../shared/ReactTypes";
import type {Fiber, FiberRoot} from "./ReactInternalTypes";
import {createFiber} from "./ReactFiber";
import {
  requestEventTime,
  requestUpdateLane,
  scheduleUpdateOnFiber,
  workInProgressRoot,
} from "./ReactFiberWorkLoop";
import {updateNode} from "./utils";
import {reconcileChildren} from "./ReactChildFiber";
import {renderWithHooks} from "./hooks";
import {createUpdate, enqueueUpdate} from "./ReactFiberClassUpdateQueue";

type OpaqueRoot = FiberRoot;

export function updateContainer(element: ReactNodeList, container: OpaqueRoot) {
  const {containerInfo} = container;
  const fiber = createFiber(element, {
    type: containerInfo.nodeName.toLocaleLowerCase(),
    stateNode: containerInfo,
  });
  // 组件初次渲染
  const current = fiber; //container.current;
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(current);

  const update = createUpdate(eventTime, lane);
  update.payload = {element};

  const root = enqueueUpdate(current, update, lane);

  console.log(
    "%c [  ]-22",
    "font-size:13px; background:pink; color:#bf2c9f;",
    root
  );
  scheduleUpdateOnFiber(root, fiber);

  return lane;
}

// 原生标签
export function updateHostComponent(wip: Fiber) {
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type);
    updateNode(wip.stateNode, {}, wip.props);
  }

  reconcileChildren(wip, wip.props.children);
}

export function updateFunctionComponent(wip: Fiber) {
  renderWithHooks(wip);

  const {type, props} = wip;

  const children = type(props);
  reconcileChildren(wip, children);
}

export function updateClassComponent(wip: Fiber) {
  const {type, props} = wip;
  const instance = new type(props);
  const children = instance.render();

  reconcileChildren(wip, children);
}

export function updateFragmentComponent(wip: Fiber) {
  reconcileChildren(wip, wip.props.children);
}

export function updateHostTextComponent(wip: Fiber) {
  wip.stateNode = document.createTextNode(wip.props.children);
}

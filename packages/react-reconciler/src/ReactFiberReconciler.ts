import {ReactNodeList} from "../../shared/ReactTypes";
import type {Fiber, FiberRoot} from "./ReactInternalTypes";
import type {RootTag} from "./ReactFiberRoot";

import {createFiberRoot} from "./ReactFiberRoot";
import {createFiber} from "./ReactFiber";
import {
  requestEventTime,
  requestUpdateLane,
  scheduleUpdateOnFiber,
} from "./ReactFiberWorkLoop";
import {updateNode} from "./utils";
import {reconcileChildren} from "./ReactChildFiber";
import {renderWithHooks} from "./hooks";
import {createUpdate, enqueueUpdate} from "./ReactFiberClassUpdateQueue";
import {Container} from "react-dom/client/ReactDOMHostConfig";

export function createContainer(containerInfo: Container, tag: RootTag) {
  return createFiberRoot(containerInfo, tag);
}

export function updateContainer(element: ReactNodeList, container: FiberRoot) {
  // const {containerInfo} = container;
  // const fiber = createFiber(element, {
  //   type: containerInfo.nodeName.toLocaleLowerCase(),
  //   stateNode: containerInfo,
  // });
  // 组件初次渲染
  const current = container.current;
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(current);

  const update = createUpdate(eventTime, lane);
  update.payload = {element};

  const root = enqueueUpdate(current, update, lane);

  scheduleUpdateOnFiber(root, current, lane, eventTime);

  return lane;
}

// 原生标签
export function updateHostComponent(wip: Fiber) {
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type);
    updateNode(wip.stateNode, {}, wip.props);
  }

  reconcileChildren(wip, wip.props.children);

  return wip.child;
}

export function updateFunctionComponent(wip: Fiber) {
  renderWithHooks(wip);

  const {type, props} = wip;

  const children = type(props);
  reconcileChildren(wip, children);

  return wip.child;
}

export function updateClassComponent(wip: Fiber) {
  const {type, props} = wip;
  const instance = new type(props);
  const children = instance.render();

  reconcileChildren(wip, children);

  return wip.child;
}

export function updateFragmentComponent(wip: Fiber) {
  reconcileChildren(wip, wip.props.children);

  return wip.child;
}

export function updateHostTextComponent(wip: Fiber) {
  wip.stateNode = document.createTextNode(wip.props.children);

  return wip.child;
}

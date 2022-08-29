import {ReactNodeList} from "../../shared/ReactTypes";
import type {Fiber, FiberRoot} from "./ReactInternalTypes";
import {createFiber} from "./ReactFiber";
import {scheduleUpdateOnFiber} from "./ReactFiberWorkLoop";
import {updateNode} from "./utils";
import {reconcileChildren} from "./ReactChildFiber";
import {renderWithHooks} from "./hooks";

type OpaqueRoot = FiberRoot;

export function updateContainer(element: ReactNodeList, container: OpaqueRoot) {
  const {containerInfo} = container;
  const fiber = createFiber(element, {
    type: containerInfo.nodeName.toLocaleLowerCase(),
    stateNode: containerInfo,
  });
  // 组件初次渲染
  scheduleUpdateOnFiber(fiber);
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

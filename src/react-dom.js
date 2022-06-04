import { createFiber } from "./ReactFiber";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render = function (children) {
  const root = this._internalRoot;
  updateContainer(children, root);
};

function updateContainer(element, container) {
  const { containerInfo } = container;
  const fiber = createFiber(element, {
    type: containerInfo.nodeName.toLocaleLowerCase(),
    stateNode: containerInfo,
  });
  scheduleUpdateOnFiber(fiber);
}

function createRoot(container) {
  const root = { containerInfo: container };
  return new ReactDOMRoot(root);
}

export default { createRoot };

// DebugReact获取方式：关注公众号“bubucuo”，回复debug
// 今天的mini获取方式：关注公众号“bubucuo”，回复5.28

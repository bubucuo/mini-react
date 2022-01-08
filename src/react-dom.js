import createFiber from "./ReactFiber";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render = function (children) {
  const root = this._internalRoot;
  updateContainer(children, root);
};

// children: vnode
function updateContainer(element, container) {
  const { containerInfo } = container;
  // 根fiber
  const rootFiber = createFiber(element, {
    type: containerInfo.nodeName.toLowerCase(),
    stateNode: containerInfo,
  });

  scheduleUpdateOnFiber(rootFiber);
}

function createRoot(container) {
  const root = { containerInfo: container };

  return new ReactDOMRoot(root);
}

export default {
  createRoot,
};

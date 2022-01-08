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
  const rootFiber = createFiber(element, {
    type: containerInfo,
    stateNode: containerInfo,
  });

  scheduleUpdateOnFiber(rootFiber);
}

function createRoot(container) {
  const root = {
    containerInfo: container,
  };

  return new ReactDOMRoot(root);
}

export default { createRoot };

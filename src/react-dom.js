import createFiber from "./createFiber";
// work in progress; 当前正在工作中的
import {scheduleUpdateOnFiber} from "./ReactFiberWorkLoop";

function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render = function(children) {
  const root = this._internalRoot;

  updateContainer(children, root);
};

function createRoot(container) {
  const root = {
    containerInfo: container,
  };

  return new ReactDOMRoot(root);
}

function updateContainer(element, container) {
  const {containerInfo} = container;
  const fiber = createFiber(element, {
    type: containerInfo.nodeName.toLowerCase(),
    stateNode: containerInfo,
  });
  scheduleUpdateOnFiber(fiber);
}

// function render(element, container) {
//   updateContainer(element, {containerInfo: container});
// }

export default {
  // render,
  createRoot,
};

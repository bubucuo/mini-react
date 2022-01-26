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
    type: containerInfo.nodeName.toLocaleLowerCase(),
    stateNode: containerInfo,
  });

  scheduleUpdateOnFiber(rootFiber);
}

function createRoot(container) {
  //   console.log("container", container); //sy-log
  //   return {
  //     render: (element) => {
  //       console.log("element", element); //sy-log
  //     },
  //   };

  const root = {
    containerInfo: container,
  };

  return new ReactDOMRoot(root);
}

export default { createRoot };

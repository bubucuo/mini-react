import type {FiberRoot} from "react-reconciler/src/ReactInternalTypes";
import {ReactNodeList} from "shared/ReactTypes";
import {updateContainer} from "react-reconciler/src/ReactFiberReconciler";

function ReactDOMRoot(internalRoot: FiberRoot) {
  this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render = function (children: ReactNodeList) {
  const root = this._internalRoot;
  updateContainer(children, root);
};

function createRoot(container: Element | Document | DocumentFragment) {
  const root = {containerInfo: container};

  return new ReactDOMRoot(root);
}

export default {createRoot};

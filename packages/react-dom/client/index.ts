import type {FiberRoot} from "react-reconciler/src/ReactInternalTypes";
import {ReactNodeList} from "shared/ReactTypes";
import {
  createContainer,
  updateContainer,
} from "react-reconciler/src/ReactFiberReconciler";
import {ConcurrentRoot} from "react-reconciler/src/ReactFiberRoot";
import {markContainerAsRoot} from "./ReactDOMComponentTree";

function ReactDOMRoot(internalRoot: FiberRoot) {
  this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render = function (children: ReactNodeList): void {
  const root = this._internalRoot;
  updateContainer(children, root);
};

function createRoot(container: Element | Document | DocumentFragment) {
  const root: FiberRoot = createContainer(container, ConcurrentRoot);

  markContainerAsRoot(root.current, container);

  return new ReactDOMRoot(root);
}

export default {createRoot};

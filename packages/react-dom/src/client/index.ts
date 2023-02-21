import type {FiberRoot} from "react-reconciler/src/ReactInternalTypes";
import {ReactElement} from "shared/ReactTypes";
import {updateContainer} from "react-reconciler/src/ReactFiberWorkLoop";
import {markContainerAsRoot} from "./ReactDOMComponentTree";
import {createFiberRoot} from "react-reconciler/src/ReactFiberRoot";

function ReactDOMRoot(internalRoot: FiberRoot) {
  this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render = function (children: ReactElement): void {
  const root = this._internalRoot;
  updateContainer(children, root);
};

function createRoot(container: Element | Document | DocumentFragment) {
  const root: FiberRoot = createFiberRoot(container);

  markContainerAsRoot(root.current, container);

  return new ReactDOMRoot(root);
}

export default {createRoot};

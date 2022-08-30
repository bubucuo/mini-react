import type {FiberRoot} from "react-reconciler/src/ReactInternalTypes";
import {ReactNodeList} from "shared/ReactTypes";
import {
  createContainer,
  updateContainer,
} from "react-reconciler/src/ReactFiberReconciler";
import {ConcurrentRoot} from "react-reconciler/src/ReactFiberRoot";
import {markContainerAsRoot} from "./ReactDOMComponentTree";

export type RootType = {
  render(children: ReactNodeList): void;
  unmount(): void;
  _internalRoot: FiberRoot | null;
};

function ReactDOMRoot(internalRoot: FiberRoot) {
  this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render = function (children: ReactNodeList): void {
  const root = this._internalRoot;
  updateContainer(children, root);
};

function createRoot(
  container: Element | Document | DocumentFragment
): RootType {
  const root = createContainer(container, ConcurrentRoot);

  console.log(
    "%c [  ]-30",
    "font-size:13px; background:pink; color:#bf2c9f;",
    root
  );
  markContainerAsRoot(root.current, container);

  // const rootContainerElement = container;
  // listenToAllSupportedEvents(rootContainerElement);

  return new ReactDOMRoot(root);
}

export default {createRoot};

import {FiberRoot} from "react-reconciler/src/ReactInternalTypes";
import {createFiberRoot} from "react-reconciler/src/ReactFiberRoot";
import {updateContainer} from "react-reconciler/src/ReactFiberWorkLoop";

function ReactDOMRoot(internalRoot: FiberRoot) {
  this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render = function (children) {
  console.log(
    "%c [  ]-11",
    "font-size:13px; background:pink; color:#bf2c9f;",
    children
  );
  updateContainer(children, this._internalRoot);
};

export function createRoot(container: Element | Document | DocumentFragment) {
  const root: FiberRoot = createFiberRoot(container);

  return new ReactDOMRoot(root);
}

export default {
  createRoot,
};

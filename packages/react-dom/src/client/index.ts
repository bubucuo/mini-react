import {createFiberRoot} from "react-reconciler/src/ReactFiberRoot";
import {FiberRoot} from "react-reconciler/src/ReactInternalTypes";
import {ReactElement} from "shared/ReactTypes";
import {updateContainer} from "react-reconciler/src/ReactFiberWorkLoop";

function ReactDOMRoot(internalRoot: FiberRoot) {
  this._internalRoot = internalRoot;
}

// 初次渲染 | 更新
ReactDOMRoot.prototype.render = function (children: ReactElement) {
  console.log(
    "%c [ children ]-12",
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

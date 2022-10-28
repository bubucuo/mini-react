import type {Container, Fiber} from "react-reconciler/src/ReactInternalTypes";

const randomKey = Math.random().toString(36).slice(2);

const internalContainerInstanceKey = "__reactContainer$" + randomKey;

export function markContainerAsRoot(hostRoot: Fiber, node: Container): void {
  node[internalContainerInstanceKey] = hostRoot;
}

export function unmarkContainerAsRoot(node: Container): void {
  node[internalContainerInstanceKey] = null;
}

export function isContainerMarkedAsRoot(node: Container): boolean {
  return !!node[internalContainerInstanceKey];
}

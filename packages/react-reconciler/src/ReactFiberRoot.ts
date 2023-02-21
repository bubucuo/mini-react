import type {Container, FiberRoot} from "../src/ReactInternalTypes";
import {createFiber} from "./ReactFiber";
import {HostRoot} from "./ReactWorkTags";

export function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo;
  this.pendingChildren = null;
  this.current = null;
  this.finishedWork = null;
  this.callbackNode = null;
}

export function createFiberRoot(containerInfo: Container): FiberRoot {
  const root: FiberRoot = new FiberRootNode(containerInfo);

  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.

  root.current = createFiber(HostRoot, null, null);
  root.current.stateNode = root;

  return root;
}

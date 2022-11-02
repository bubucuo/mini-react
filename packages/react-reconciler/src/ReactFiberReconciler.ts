import {ReactNodeList} from "../../shared/ReactTypes";
import type {Container, Fiber, FiberRoot} from "./ReactInternalTypes";
import type {RootTag} from "./ReactFiberRoot";

import {createFiberRoot} from "./ReactFiberRoot";
import {createFiber} from "./ReactFiber";
import {requestUpdateLane, scheduleUpdateOnFiber} from "./ReactFiberWorkLoop";
import {updateNode} from "./utils";
import {renderWithHooks} from "./hooks";
import {createUpdate, enqueueUpdate} from "./ReactFiberClassUpdateQueue";
import {getCurrentTime} from "shared/utils";

export function createContainer(containerInfo: Container, tag: RootTag) {
  return createFiberRoot(containerInfo, tag);
}

export function updateContainer(element: ReactNodeList, container: FiberRoot) {
  // const {containerInfo} = container;
  // const fiber = createFiber(element, {
  //   type: containerInfo.nodeName.toLocaleLowerCase(),
  //   stateNode: containerInfo,
  // });
  // 组件初次渲染
  const current = container.current;
  const eventTime = getCurrentTime();
  const lane = requestUpdateLane(current);

  const update = createUpdate(eventTime, lane);
  update.payload = {element};

  const root = enqueueUpdate(current, update as any, lane);

  scheduleUpdateOnFiber(root, current, lane, eventTime);

  return lane;
}

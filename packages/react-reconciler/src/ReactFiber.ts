import {ReactElement} from "shared/ReactTypes";
import {isFn} from "shared/utils";
import {NoFlags} from "./ReactFiberFlags";
import {Fiber} from "./ReactInternalTypes";
import {isStr} from "../../shared/utils";
import {Fragment, HostComponent, HostText} from "./ReactWorkTags";
import {
  IndeterminateComponent,
  WorkTag,
  ClassComponent,
  FunctionComponent,
} from "./ReactWorkTags";
import {REACT_FRAGMENT_TYPE} from "shared/ReactSymbols";

// 创建一个fiber
export function createFiber(
  tag: WorkTag,
  pendingProps: any,
  key: null | string,
  returnFiber: Fiber | null
): Fiber {
  return new FiberNode(tag, pendingProps, key, returnFiber);
}

function FiberNode(
  tag: WorkTag,
  pendingProps: any,
  key: null | string,
  returnFiber: Fiber
) {
  // Instance
  // 标记组件类型
  this.tag = tag;
  // 定义组件在当前层级下的唯一性
  this.key = key;
  // 组件类型
  this.elementType = null;
  // 组件类型
  this.type = null;
  // 不同的组件的  stateNode 定义也不同
  // 原生标签：string
  // 类组件：实例
  this.stateNode = null;

  // Fiber
  this.return = returnFiber; //null;
  this.child = null;
  this.sibling = null;
  // 记录了节点在兄弟节点中的位置下标，用于diff时候判断节点是否需要发生移动
  this.index = 0;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  // 不同的组件的 memoizedState 指代也不同
  // 函数组件 hook0
  // 类组件 state
  this.memoizedState = null;

  // Effects
  this.flags = NoFlags;
  this.subtreeFlags = NoFlags;
  // 记录要删除的子节点
  this.deletions = null;

  // 缓存fiber
  this.alternate = null;
}

// 根据 ReactElement 创建Fiber
export function createFiberFromElement(
  element: ReactElement,
  returnFiber: Fiber
) {
  const {type, key} = element;
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    returnFiber
  );
  return fiber;
}

// 根据 TypeAndProps 创建fiber
export function createFiberFromTypeAndProps(
  type: any,
  key: null | string,
  pendingProps: any,
  returnFiber: Fiber
) {
  let fiberTag: WorkTag = IndeterminateComponent;
  if (isFn(type)) {
    // 判断函数组件还是类组件
    if (shouldConstruct(type)) {
      fiberTag = ClassComponent;
    } else {
      fiberTag = FunctionComponent;
    }
  } else if (isStr(type)) {
    // 原生标签
    fiberTag = HostComponent;
  } else if (type === REACT_FRAGMENT_TYPE) {
    fiberTag = Fragment;
  }

  const fiber = createFiber(fiberTag, pendingProps, key, returnFiber);
  fiber.elementType = type;
  fiber.type = type;
  return fiber;
}

// 判断是否是类组件
function shouldConstruct(Component: Function) {
  const prototype = Component.prototype;

  return !!(prototype && prototype.isReactComponent);
}

export function createFiberFromText(content: string, returnFiber: Fiber) {
  const fiber = createFiber(HostText, content, null, returnFiber);
  return fiber;
}

export type Source = {
  fileName: string;
  lineNumber: number;
};

export type ReactElement = {
  $$typeof: any;
  type: any;
  key: any;
  ref: any;
  props: any;
  // ReactFiber
  _owner: any;
};

export type ReactNode = ReactElement | ReactText | ReactFragment;
// | ReactPortal
// | ReactProvider<any>
// | ReactConsumer<any>;

export type ReactEmpty = null | void | boolean;

export type ReactFragment = ReactEmpty | Iterable<ReactNode>;

export type ReactNodeList = ReactEmpty | ReactNode;

export type ReactText = string | number;

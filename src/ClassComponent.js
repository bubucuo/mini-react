function Component(props) {
  this.props = props;
}

// 区分函数组件与类组件
Component.prototype.isReactComponent = {};

export { Component };

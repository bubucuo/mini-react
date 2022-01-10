// import React from "react";
// import ReactDOM from "react-dom";
import { ReactDOM, Component } from "../which-react";

import "./index.css";

function FunctionComponent(props) {
  return (
    <div className="border">
      <p>{props.name}</p>
    </div>
  );
}

class ClassComponent extends Component {
  render() {
    return (
      <div className="border">
        <h3>{this.props.name}</h3>
      </div>
    );
  }
}

const jsx = (
  <div className="border">
    <h1>react</h1>
    <a href="https://github.com/bubucuo/mini-react">mini react</a>
    <FunctionComponent name="函数组件" />
    <ClassComponent name="类组件" />
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(jsx);

// 实现了常见组件渲染

// 原生标签
// 函数组件
// 类组件
// Fragment

// import React from "react";
// import ReactDOM from "react-dom";
import { ReactDOM, Component, useReducer } from "../which-react";

import "./index.css";

// fiber.memorizedState(hook0)->next(hook1)->next(hook2)
// hooks { state, setState, deps}
function FunctionComponent(props) {
  const [count, setCount] = useReducer((x) => x + 1, 0); //hooks0
  // const [count1, setCount1] = useReducer((x) => x + 1, 0); //hooks1
  // const [count2, setCount2] = useReducer((x) => x + 1, 0); //hooks2

  return (
    <div className="border">
      <h3>{props.name}</h3>
      <button onClick={() => setCount()}>{count}</button>

      {count % 2 ? <div>123</div> : <span>omg</span>}
    </div>
  );
}

class ClassComponent extends Component {
  render() {
    return (
      <div className="border">
        <h3>{this.props.name}</h3>
        omg
      </div>
    );
  }
}

function FragmentComponent() {
  return (
    <ul>
      <>
        <li>part1</li>
        <li>part2</li>
      </>
    </ul>
  );
}

const jsx = (
  <div className="border">
    <h1>react</h1>
    <a href="https://github.com/bubucuo/mini-react">mini react</a>
    <FunctionComponent name="函数组件" />
    <ClassComponent name="类组件" />
    <FragmentComponent />
  </div>
);

// ReactDOM.render(document.getElementById("root"), jsx);

const obj = ReactDOM.createRoot(document.getElementById("root"));
obj.render(jsx);
// obj.render(jsx1);

// 实现了常见组件初次渲染

// 原生标签
// 函数组件
// 类组件
// 文本
// Fragment

// 实现了函数组件的更新
// 实现hook useReducer、useState

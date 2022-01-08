// import React from "react";
// import ReactDOM from "react-dom";

import { ReactDOM } from "../which-react";

import "./index.css";

function FunctionComponent(props) {
  return (
    <div className="border">
      <p>{props.name}</p>
    </div>
  );
}

const jsx = (
  <div className="border">
    <h1>react</h1>
    <a href="https://github.com/bubucuo/mini-react">mini react</a>
    <FunctionComponent name="函数组件" />
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(jsx);

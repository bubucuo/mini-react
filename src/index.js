import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

const jsx = (
  <div className="border">
    <h1>全栈</h1>
    <a href="https://juejin.cn/user/3878732755375742">掘金</a>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(jsx);

console.log("React", React.version); //sy-log

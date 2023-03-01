import {ReactDOM} from "../which-react";

import "./index.css";

const jsx = (
  <div className="border">
    <h1>react</h1>
    <a href="https://github.com/bubucuo/mini-react">mini react</a>
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);

// 函数组件
// 类组件
// Fragment

// import React from "react";
// import ReactDOM from "react-dom";
// import {  useReducer } from "react";
import {ReactDOM} from "../which-react";

import "./index.css";

// function FunctionComponent(props: {name: string}) {
//   return (
//     <div
//       className="border red pink black id cls id as as xc vc sd as "
//       id="123"
//       data-id="123">
//       <p>{props.name}</p>
//     </div>
//   );
// }

const jsx = (
  <div className="border">
    <h1>react</h1>
    <a href="https://github.com/bubucuo/mini-react">mini react</a>
    {/* <FunctionComponent name="aa" /> */}
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);

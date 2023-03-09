import {ReactDOM, Component, useReducer, useState} from "../which-react";

import "./index.css";

// class ClassComponent extends Component {
//   render() {
//     return (
//       <div className="border">
//         <h3>{this.props.name}</h3>
//       </div>
//     );
//   }
// }

function FunctionComponent(props: {name: string}) {
  const [count, setCount] = useReducer((x) => x + 1, 0);
  const [count2, setCount2] = useState(0);

  return (
    <div className="border">
      <p>{props.name}</p>
      <button onClick={() => setCount()}>{count}</button>
      <button onClick={() => setCount2(count2 + 1)}>{count2}</button>

      {count % 2 ? <div>omg</div> : <span>123</span>}

      <ul>
        {count % 2 === 0
          ? [2, 1, 3, 4].map((item) => {
              return <li key={item}>{item}</li>;
            })
          : [0, 1, 2, 3, 4].map((item) => {
              return <li key={item}>{item}</li>;
            })}
      </ul>
    </div>
  );
}

function FunctionComponent2(props: {name: string}) {
  const [count, setCount] = useReducer((x) => x + 1, 0);
  const [count2, setCount2] = useState(0);

  return (
    <div className="border">
      <p>{props.name}</p>
      <button onClick={() => setCount()}>{count}</button>
      <button onClick={() => setCount2(count2 + 1)}>{count2}</button>

      {count % 2 ? <div>omg</div> : <span>123</span>}

      <ul>
        {count % 2 === 0
          ? [2, 1, 3, 4].map((item) => {
              return <li key={item}>{item}</li>;
            })
          : [0, 1, 2, 3, 4].map((item) => {
              return <li key={item}>{item}</li>;
            })}
      </ul>
    </div>
  );
}

const jsx = (
  <div className="border">
    <h1>react</h1>
    <a href="https://github.com/bubucuo/mini-react">mini react</a>
    <FunctionComponent name="函数组件" />
    <FunctionComponent2 name="函数组件2" />

    {/* <ClassComponent name="类组件" />
    omg文本
    <ul>
      <>
        <li>节点1</li>
        <li>节点2</li>
      </>
    </ul> */}
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);

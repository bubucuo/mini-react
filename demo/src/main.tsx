import {
  ReactDOM,
  Component,
  useReducer,
  useState,
  useLayoutEffect,
  useEffect,
} from "../which-react";

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

  useLayoutEffect(() => {
    console.log(
      "%c [ useLayoutEffect  ]-34",
      "font-size:13px; background:pink; color:#bf2c9f;"
    );
  }, [count]);

  useEffect(() => {
    console.log(
      "%c [ useEffect ]-29",
      "font-size:13px; background:pink; color:#bf2c9f;"
    );
  }, []);

  return (
    <div className="border">
      <p>{props.name}</p>
      <button onClick={() => setCount()}>{count}</button>
      <button onClick={() => setCount2(count2 + 1)}>{count2}</button>

      {count % 2 ? <div>omg</div> : <span>123</span>}

      <ul>
        {/* <li>随着count2的奇偶性变化</li> */}
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

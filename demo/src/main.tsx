import {
  ReactDOM,
  Component,
  useReducer,
  useState,
  useLayoutEffect,
  useEffect,
  useMemo,
  useCallback,
  PureComponent,
} from "../which-react";

import "./index.css";

// class ClassComponent extends PureComponent {
// class ClassComponent extends Component {
//   shouldComponentUpdate(nextProps) {
//     return nextProps.addClick !== this.props.addClick;
//   }
//   render() {
//     console.log("ClassComponent render");
//     return (
//       <div className="border">
//         <h3>{this.props.name}</h3>
//         <button onClick={() => console.log(this.props.addClick())}>add</button>
//       </div>
//     );
//   }
// }

function FunctionComponent(props: {name: string}) {
  const [count, setCount] = useReducer((x) => x + 1, 0);
  const [count2, setCount2] = useState(0);

  const addClick = useCallback(() => {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += i;
    }
    return sum;
  }, [count]);

  useEffect(() => {
    console.log(
      "%c [  ]-46",
      "font-size:13px; background:pink; color:#bf2c9f;"
    );
  }, [addClick]);

  return (
    <div className="border">
      <p>{props.name}</p>
      <button onClick={() => setCount()}>{count}</button>
      <button onClick={() => setCount2(count2 + 1)}>{count2}</button>

      {/* <ClassComponent name="类组件" addClick={addClick} /> */}

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
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);

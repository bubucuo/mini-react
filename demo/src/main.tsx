import {
  ReactDOM,
  Component,
  PureComponent,
  useReducer,
  useState,
  useLayoutEffect,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "../which-react";

import "./index.css";

const CountContext = createContext();

// stack
// leetcode 括号匹配
// 受限的数据结构
// push 只能在栈尾
// pop 只能在栈尾
// read 只能在栈尾

function FunctionComponent(props: {name: string}) {
  const [count, setCount] = useReducer((x) => x + 1, 0);

  return (
    <div className="border">
      <p>{props.name}</p>
      <button onClick={() => setCount()}>{count}</button>

      <CountContext.Provider value={999}>
        <CountContext.Provider value={count}>
          <Child tips="one" />
          <ClassComponent name="类组件" />
        </CountContext.Provider>

        <Child tips="two" />
      </CountContext.Provider>
    </div>
  );
}

function Child({tips}) {
  const count = useContext(CountContext);
  return (
    <div className="border">
      <h1>Child {tips}</h1>
      <h1>{count}</h1>

      <CountContext.Consumer>{(ctx) => <h1>{ctx}</h1>}</CountContext.Consumer>
    </div>
  );
}

class ClassComponent extends Component {
  static contextType = CountContext;
  render() {
    console.log("ClassComponent render");
    return (
      <div className="border">
        <h3>{this.props.name}</h3>
        <p>{this.context}</p>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <FunctionComponent name="函数组件" />
);

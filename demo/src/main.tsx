import {
  ReactDOM,
  Component,
  useReducer,
  useState,
  useLayoutEffect,
  useEffect,
  useMemo,
  useCallback,
  // PureComponent,
  createContext,
  useContext,
} from "../which-react";

import "./index.css";

const CountContext = createContext();

function FunctionComponent(props: {name: string}) {
  const [count, setCount] = useReducer((x) => x + 1, 0);

  return (
    <div className="border">
      <p>{props.name}</p>
      <button onClick={() => setCount()}>{count}</button>

      <CountContext.Provider value={count}>
        {/* <CountContext.Provider value={99}> */}
        <Child />
        {/* </CountContext.Provider> */}
      </CountContext.Provider>
    </div>
  );
}

function Child() {
  const count = useContext(CountContext);
  return <div className="border">{count}</div>;
}

const jsx = (
  <div className="border">
    <h1>react</h1>
    <a href="https://github.com/bubucuo/mini-react">mini react</a>
    <FunctionComponent name="函数组件" />
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <FunctionComponent name="函数组件" />
);

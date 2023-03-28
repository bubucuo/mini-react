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

function FunctionComponent(props: {name: string}) {
  const [count, setCount] = useReducer((x) => x + 1, 0);

  return (
    <div className="border">
      <p>{props.name}</p>
      <button onClick={() => setCount()}>{count}</button>

      <CountContext.Provider value={999}>
        <CountContext.Provider value={count}>
          <Child />
        </CountContext.Provider>
      </CountContext.Provider>
    </div>
  );
}

function Child() {
  const count = useContext(CountContext);
  return <div className="border">{count}</div>;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <FunctionComponent name="函数组件" />
);

import {
  ReactDOM,
  Component,
  useReducer,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  createContext,
  useContext,
  // PureComponent,
} from "../which-react";

import "./index.css";

const CountContext = createContext();

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

function FunctionComponent(props: {name: string}) {
  const [count, setCount] = useReducer((x) => x + 1, 0);

  return (
    <div className="border">
      <p>{props.name}</p>
      <button onClick={() => setCount()}>{count}</button>

      <CountContext.Provider value={count}>
        {/* <CountContext.Provider value={99}> */}
        <Child />
        <ClassComponent name="类组件" />
        {/* </CountContext.Provider> */}
      </CountContext.Provider>
    </div>
  );
}

function Child() {
  const count = useContext(CountContext);
  return (
    <div className="border">
      <h1>{count}</h1>

      <CountContext.Consumer>{(ctx) => <h1>{ctx}</h1>}</CountContext.Consumer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <FunctionComponent name="函数组件" />
);

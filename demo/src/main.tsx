import {ReactDOM, Component} from "../which-react";

import "./index.css";

class ClassComponent extends Component {
  render() {
    return (
      <div className="border">
        <h3>{this.props.name}</h3>
      </div>
    );
  }
}

function FunctionComponent(props: {name: string}) {
  return (
    <div className="border">
      <p>{props.name}</p>
    </div>
  );
}

const jsx = (
  <div className="border">
    <h1>react</h1>
    <a href="https://github.com/bubucuo/mini-react">mini react</a>
    <FunctionComponent name="函数组件" />
    <ClassComponent name="类组件" />
    omg文本
    <ul>
      <>
        <li>节点1</li>
        <li>节点2</li>
      </>
    </ul>
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);

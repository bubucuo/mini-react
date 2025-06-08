import { useState } from "react";
import { add } from "../../../packages/shared";

export function FunctionComponent() {
  const [count, setCount] = useState(0);

  const sum = add(1, 2);

  return (
    <div className="border">
      <h1>函数组件</h1>
      <button
        onClick={() => {
          setCount(count + 1);
        }}
      >
        {count}
      </button>

      <p>1 + 2 = {sum}</p>
    </div>
  );
}

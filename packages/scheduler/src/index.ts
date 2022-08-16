import {hello} from "shared";

export default function (document) {
  console.log("Hello Vite");
  console.log(hello);

  const e = document.createElement("h1");
  e.className = "c1";
  e.innerHTML = "🚗 Hello Vite";
  document.body.appendChild(e);
}

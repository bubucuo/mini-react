# mini react 指南

**本项目是基于react开发的mini版，旨在帮助广大react爱好者精通react原理，本项目仅供学习者个人学习使用。**

本项目目前对标react 18 rc版。

开发者：gaoshaoyun，关注公众号bubucuo，回复“1”加开发者个人微信，回复"2"加专业开发交流群，即可获取更多学习资源~



## 链接

1. [React官方文档](https://react.docschina.org/)

2. [React github](https://github.com/facebook/react/)

3. mini react源码思维导图

4. [React18新特性尝试](https://github.com/bubucuo/react18-ice)

5. [React18新特性免费视频教程](https://www.bilibili.com/video/BV1rK4y137D3/)

   

## 开始

## 项目初始化

首先创建mini-react的文件夹，创建demo(测试代码)、docs(文档)、src(mini react源码)。

![image-20220107153506186](https://tva1.sinaimg.cn/large/008i3skNly1gy55atj1xyj30ec07cglv.jpg)

demo下的测试代码基于vite，构建过程如下：

[如何基于Vite启动一个React项目](https://juejin.cn/post/6922701449818292232)

```
创建一个基于vite的名称为demo项目：yarn create @vitejs/app demo --template react
进入demo目录：cd demo
在demo下安装依赖：yarn
安装 react 的最新 rc 版本：yarn add react@rc react-dom@rc
启动：yarn dev
浏览器端打开 http://localhost:3000/
```



### demo配置

在demo下建立which-react.js，在这里决定是引入mini react还是react，demo里的组件所需要的react api都从which-react引入。统一管理~

```js
import React, { useReducer } from "react";
import ReactDOM from "react-dom";

// import { useReducer } from "../src/react";
// import ReactDOM from "../src/react-dom";

export { ReactDOM, useReducer };
```



#### demo/src/main.jsx

```jsx
import { ReactDOM } from "../which-react";
import "./index.css";

const jsx = (
  <div className="border">
    <h1>react</h1>
    <a href="https://github.com/bubucuo/mini-react">mini react</a>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(jsx);
```



#### index.css

```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.border {
  margin: 10px;
  padding: 10px;
  border: solid pink 1px;
  font-size: 14px;
}
```




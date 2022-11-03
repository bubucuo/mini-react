import { getCurrentTime as I, isObject as W, isFn as S } from "shared/utils";
const se = 0, Y = 1, B = 2, U = 3, D = 4, N = 5, j = 1073741823, q = -1, A = 250, Q = 5e3, z = 1e4, F = j;
function G(e) {
  let t;
  switch (e) {
    case Y:
      t = q;
      break;
    case B:
      t = A;
      break;
    case N:
      t = F;
      break;
    case D:
      t = z;
      break;
    case U:
    default:
      t = Q;
      break;
  }
  return t;
}
function _(e, t) {
  const l = e.length;
  e.push(t), K(e, t, l);
}
function c(e) {
  return e.length === 0 ? null : e[0];
}
function b(e) {
  if (e.length === 0)
    return null;
  const t = e[0], l = e.pop();
  return l !== t && (e[0] = l, J(e, l, 0)), t;
}
function K(e, t, l) {
  let n = l;
  for (; n > 0; ) {
    const r = n - 1 >>> 1, f = e[r];
    if (y(f, t) > 0)
      e[r] = t, e[n] = f, n = r;
    else
      return;
  }
}
function J(e, t, l) {
  let n = l;
  const r = e.length, f = r >>> 1;
  for (; n < f; ) {
    const o = (n + 1) * 2 - 1, u = e[o], s = o + 1, k = e[s];
    if (y(u, t) < 0)
      s < r && y(k, u) < 0 ? (e[n] = k, e[s] = t, n = s) : (e[n] = u, e[o] = t, n = o);
    else if (s < r && y(k, t) < 0)
      e[n] = k, e[s] = t, n = s;
    else
      return;
  }
}
function y(e, t) {
  const l = e.sortIndex - t.sortIndex;
  return l !== 0 ? l : e.id - t.id;
}
const a = [], m = [];
let h = 1, i = null, x = U, d = !1, T = !1, L = !1, R, O = !1, P = null, w = -1, V = 5;
function E() {
  clearTimeout(h), h = -1;
}
function C(e, t) {
  h = setTimeout(() => {
    e(I());
  }, t);
}
function g(e) {
  let t = c(m);
  for (; t !== null; ) {
    if (t.callback === null)
      b(m);
    else if (t.startTime <= e)
      b(m), t.sortIndex = t.expirationTime, _(a, t);
    else
      return;
    t = c(m);
  }
}
function M(e) {
  if (d = !1, g(e), !T)
    if (c(a) !== null)
      T = !0, v(H);
    else {
      const t = c(m);
      t !== null && C(M, t.startTime - e);
    }
}
function v(e) {
  P = e, O || (O = !0, R());
}
const X = () => {
  if (P !== null) {
    const e = I();
    w = e;
    const t = !0;
    let l = !0;
    try {
      l = P(t, e);
    } finally {
      l ? R() : (O = !1, P = null);
    }
  } else
    O = !1;
}, p = new MessageChannel(), Z = p.port2;
p.port1.onmessage = X;
R = () => {
  Z.postMessage(null);
};
function H(e, t) {
  T = !1, d && (d = !1, E()), L = !0;
  let l = x;
  try {
    return $(e, t);
  } finally {
    i = null, x = l, L = !1;
  }
}
function $(e, t) {
  let l = t;
  for (g(l), i = c(a); i !== null; ) {
    const n = ee();
    if (i.expirationTime > l && (!e || n))
      break;
    const r = i.callback;
    if (x = i.priorityLevel, S(r)) {
      i.callback = null;
      const f = i.expirationTime <= l, o = r(f);
      if (l = I(), S(o))
        return i.callback = o, g(l), !0;
      i === c(a) && b(a), g(l);
    } else
      b(a);
    i = c(a);
  }
  if (i !== null)
    return !0;
  {
    const n = c(m);
    return n !== null && C(M, n.startTime - l), !1;
  }
}
function ee() {
  return !(I() - w < V);
}
function te(e, t, l) {
  const n = I();
  let r;
  if (W(l) && l !== null) {
    let s = l == null ? void 0 : l.delay;
    typeof s == "number" && s > 0 ? r = n + s : r = n;
  } else
    r = n;
  const f = G(e), o = r + f, u = {
    id: h++,
    callback: t,
    priorityLevel: e,
    startTime: r,
    expirationTime: o,
    sortIndex: -1
  };
  r > n ? (u.sortIndex = r, _(m, u), c(a) === null && u === c(m) && (d ? E() : d = !0, C(M, r - n))) : (u.sortIndex = o, _(a, u), !T && !L && (T = !0, v(H)));
}
function le(e) {
  e.callback = null;
}
function ne() {
  return x;
}
function re() {
}
const oe = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  scheduleCallback: te,
  cancelCallback: le,
  getCurrentPriorityLevel: ne,
  requestPaint: re
}, Symbol.toStringTag, { value: "Module" }));
export {
  F as IDLE_PRIORITY_TIMEOUT,
  q as IMMEDIATE_PRIORITY_TIMEOUT,
  N as IdlePriority,
  N as IdleSchedulerPriority,
  Y as ImmediatePriority,
  Y as ImmediateSchedulerPriority,
  z as LOW_PRIORITY_TIMEOUT,
  D as LowPriority,
  D as LowSchedulerPriority,
  Q as NORMAL_PRIORITY_TIMEOUT,
  se as NoPriority,
  U as NormalPriority,
  U as NormalSchedulerPriority,
  oe as Scheduler,
  A as USER_BLOCKING_PRIORITY_TIMEOUT,
  B as UserBlockingPriority,
  B as UserBlockingSchedulerPriority,
  ne as getCurrentSchedulerPriorityLevel,
  G as getTimeoutByPriorityLevel
};
//# sourceMappingURL=scheduler.esm.js.map

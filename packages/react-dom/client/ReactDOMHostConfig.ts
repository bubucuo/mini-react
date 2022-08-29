import {DefaultEventPriority} from "react-reconciler/src/ReactEventPriorities";
import {getEventPriority} from "../events/ReactDOMEventListener";

export function getCurrentEventPriority() {
  const currentEvent = window.event;

  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type);
}

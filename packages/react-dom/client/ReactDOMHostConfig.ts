import {DefaultEventPriority} from "react-reconciler/src/ReactEventPriorities";

export function getCurrentEventPriority() {
  const currentEvent = window.event;

  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  // todo
  // return getEventPriority(currentEvent.type);
}

export function shouldSetTextContent(type: string, props: any): boolean {
  return (
    type === "textarea" ||
    type === "noscript" ||
    typeof props.children === "string" ||
    typeof props.children === "number" ||
    (typeof props.dangerouslySetInnerHTML === "object" &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

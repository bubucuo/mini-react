import {REACT_PROVIDER_TYPE, REACT_CONTEXT_TYPE} from "shared/ReactSymbols";
import {ReactContext} from "shared/ReactTypes";

export function createContext<T>(defaultValue: T): ReactContext<T> {
  const context: ReactContext<T> = {
    $$typeof: REACT_CONTEXT_TYPE,

    _currentValue: defaultValue,

    Provider: null,
    Consumer: null,
  };

  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  };

  context.Consumer = context;

  return context;
}

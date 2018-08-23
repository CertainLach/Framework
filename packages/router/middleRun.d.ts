import { IRouterContext } from "./";
export default function middleRun<T>(middleware: Function | Function[]): (context: IRouterContext<any>) => () => Promise<void | T>;

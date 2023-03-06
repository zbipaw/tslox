import { Interpreter } from "./Interpreter";

export interface Callable {
    arity(): Number;
    call(interpreter: Interpreter, args: Object[]): Object | null;
    toString(): string;
}

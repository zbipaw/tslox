import { Interpreter } from "./Interpreter";
import { Nullable } from "./Types";

export interface Callable {
    arity(): Number;
    call(interpreter: Interpreter, args: Object[]): Nullable<Object>;
    toString(): string;
}

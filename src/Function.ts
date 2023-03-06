import { isInt16Array } from "util/types";
import { Callable } from "./Callable";
import { Environment } from "./Environment";
import { FunctionStmt } from "./gen/Stmt";
import { Interpreter } from "./Interpreter";
import { Return } from "./Return";

export class Function implements Callable {
    private declaration: FunctionStmt;
    private closure: Environment;

    constructor(declaration: FunctionStmt, closure: Environment) {
        this.declaration = declaration;
        this.closure = closure;
    }

    arity() {
        return this.declaration.params.length;
    }

    call(interpreter: Interpreter, args: Object[]): Object | null {
        const environment: Environment = new Environment(this.closure);
        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(
                this.declaration.params[i].lexeme, args[i]
            );
        }
        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (returnValue) {
            if (returnValue instanceof Return) {
                return returnValue.value;
            }
            throw returnValue;
        }
        return null;
    }

    toString(): string {
        return `<function ${this.declaration.name.lexeme}>`;
    }
}

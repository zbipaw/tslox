import { isInt16Array } from "util/types";
import { Callable } from "./Callable";
import { Environment } from "./Environment";
import { FunctionStmt } from "./gen/Stmt";
import { Instance } from "./Instance";
import { Interpreter } from "./Interpreter";
import { Return } from "./Return";
import { Nullable } from "./Types";

export class Function implements Callable {
    private declaration: FunctionStmt;
    private closure: Environment;
    private isInitializer: boolean;

    constructor(declaration: FunctionStmt, closure: Environment, isInitializer: boolean) {
        this.declaration = declaration;
        this.closure = closure;
        this.isInitializer = isInitializer;
    }

    arity(): Number {
        return this.declaration.params.length;
    }

    bind(instance: Instance): Function {
        const environment = new Environment(this.closure);
        environment.define("this", instance);
        return new Function(this.declaration, environment, this.isInitializer);
    }

    call(interpreter: Interpreter, args: Object[]): Nullable<Object> {
        const environment: Environment = new Environment(this.closure);
        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(
                this.declaration.params[i].lexeme, args[i]
            );
        }
        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (returnValue) {
            if (this.isInitializer) return this.closure.getAt(0, "this");
            if (returnValue instanceof Return) {
                return returnValue.value;
            }
            throw returnValue;
        }
        if (this.isInitializer) return this.closure.getAt(0, "this");
        return null;
    }

    toString(): string {
        return `<function ${this.declaration.name.lexeme}>`;
    }
}

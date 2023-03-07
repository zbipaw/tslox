import { Callable } from "./Callable";
import { Function } from "./Function";
import { Instance } from "./Instance";
import { Interpreter } from "./Interpreter";
import { Nullable } from "./Types";

export class Klass implements Callable{
    name: string;
    methods: Map<string, Function> = new Map();

    constructor(name: string, methods: Map<string, Function>) {
        this.name = name;
        this.methods = methods;
    }

    arity(): number {
        return 0;
    }

    call(interpreter: Interpreter, args: Object[]): Instance {
        const instance = new Instance(this);
        return instance;
    }

    findMethod(name: string): Nullable<Function> {
        if (this.methods.has(name)) {
            return this.methods.get(name) as Function;
        }
        return null;
    }

    toString(): string {
        return this.name;
    }
}
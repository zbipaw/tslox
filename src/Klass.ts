import { Callable } from "./Callable";
import { Function } from "./Function";
import { Instance } from "./Instance";
import { Interpreter } from "./Interpreter";
import { Nullable } from "./Types";

export class Klass implements Callable{
    name: string;
    superklass: Klass;
    methods: Map<string, Function> = new Map();

    constructor(name: string, superklass: Klass, methods: Map<string, Function>) {
        this.name = name;
        this.superklass = superklass;
        this.methods = methods;
    }

    arity(): Number {
        const initializer = this.findMethod("init");
        if (initializer === null) return 0;
        return initializer.arity();
    }

    call(interpreter: Interpreter, args: Object[]): Instance {
        const instance = new Instance(this);
        const initializer = this.findMethod("init");
        if (initializer != null) {
            initializer.bind(instance).call(interpreter, args);
        }
        return instance;
    }

    findMethod(name: string): Nullable<Function> {
        if (this.methods.has(name)) {
            return this.methods.get(name) as Function;
        }
        if (this.superklass !== null) {
            return this.superklass.findMethod(name);
        }
        return null;
    }

    toString(): string {
        return this.name;
    }
}
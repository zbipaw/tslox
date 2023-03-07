import { RuntimeError } from "./Error";
import { Klass } from "./Klass";
import { Token } from "./Token";
import { Nullable } from "./Types";

export class Instance {
    private klass: Klass;
    private fields: Map<string, Object> = new Map();

    constructor(klass: Klass) {
        this.klass = klass;
    }

    get(name: Token): Nullable<Object> {
        if (this.fields.has(name.lexeme)) {
            return this.fields.get(name.lexeme) ?? null;
        }
        const method = this.klass.findMethod(name.lexeme);
        if (method != null) return method.bind(this);
        throw new RuntimeError(name, `Undefined property ' + ${name.lexeme} + '.`);
    }

    set(name: Token, value: Object): void {
        this.fields.set(name.lexeme, value);
    }

    toString(): string {
        return `${this.klass.name} instance`
    }
}
import { RuntimeError } from "./Error";
import { Token } from "./Token";

export class Environment {
    enclosing: Environment | null;
    private values = new Map<String, Object | null>();

    constructor(enclosing: Environment | null = null) {
        this.enclosing = enclosing;
    }

    define(name: string, value: Object | null): void {
        this.values.set(name, value);
    }

    get(name: Token): Object | null {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme) ?? null;
        }
        if (this.enclosing !== null) return this.enclosing.get(name);
        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    assign(name: Token, value: Object): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }
        if (this.enclosing !== null) {
            this.enclosing.assign(name, value);
            return;
        }
        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }
}
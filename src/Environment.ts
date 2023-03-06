import { RuntimeError } from "./Error";
import { Literal, Token } from "./Token";

export class Environment {
    enclosing: Environment | null;
    private values = new Map<String, Literal>();

    constructor(enclosing: Environment | null = null) {
        this.enclosing = enclosing;
    }

    define(name: string, value: Literal): void {
        this.values.set(name, value);
    }

    get(name: Token): Literal {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme) ?? null;
        }
        if (this.enclosing !== null) return this.enclosing.get(name);
        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    assign(name: Token, value: Literal): void {
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
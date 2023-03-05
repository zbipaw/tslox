import { RuntimeError } from "./Error";
import { Literal, Token } from "./Token";

export class Environment {
    private values = new Map<String, Literal>();

    define(name: string, value: Literal): void {
        this.values.set(name, value);
    }

    get(name: Token): Literal {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme) ?? null;
        }
        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }
}
import { RuntimeError } from "./Error";
import { Token } from "./Token";
import { Nullable } from "./Types";

export class Environment {
    enclosing: Nullable<Environment>;
    private values = new Map<String, Nullable<Object>>();

    constructor(enclosing: Nullable<Environment> = null) {
        this.enclosing = enclosing;
    }

    ancestor(dist: number): Environment {
        let environment: Environment = this;
        for (let i = 0; i < dist; i++) {
            environment = environment.enclosing as Environment;
        }
        return environment;
    }

    assign(name: Token, value: Object): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }
        if (this.enclosing != null) {
            this.enclosing.assign(name, value);
            return;
        }
        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    assignAt(dist: number, name: Token, value: Object): Nullable<Object> {
        return this.ancestor(dist).values.set(name.lexeme, value) ?? null;
    }

    define(name: string, value: Nullable<Object>): void {
        this.values.set(name, value);
    }

    get(name: Token): Nullable<Object> {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme) ?? null;
        }
        if (this.enclosing != null) return this.enclosing.get(name);
        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    getAt(dist: number, name: string): Nullable<Object> {
        return this.ancestor(dist).values.get(name) ?? null;
    }
}
import { TokenType } from "./TokenType";
import { Nullable } from "./Types";

export class Token {
    type: TokenType;
    lexeme: string;
    literal: Nullable<Object>;
    line: number;

    constructor(type: TokenType, lexeme: string, literal: Nullable<Object>, line: number
    ) { 
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }

    toString(): string {
        return `<${this.type}> ${this.lexeme} - ${this.literal} @ line:${this.line}`
    }
}

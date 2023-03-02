import { Lox } from "./Lox";
import { Token } from "./Token";
import { TokenType } from "./TokenType"

const keywords: Map<string, TokenType> = new Map([
    ['and', TokenType.AND],
    ['class', TokenType.CLASS],
    ['else', TokenType.ELSE],
    ['false', TokenType.FALSE],
    ['fun', TokenType.FUN],
    ['for', TokenType.FOR],
    ['if', TokenType.IF],
    ['nil', TokenType.NIL],
    ['or', TokenType.OR],
    ['print', TokenType.PRINT],
    ['return', TokenType.RETURN],
    ['super', TokenType.SUPER],
    ['this', TokenType.THIS],
    ['true', TokenType.TRUE],
    ['var', TokenType.VAR],
    ['while', TokenType.WHILE],
])

export class Scanner {
    private source: string;
    private tokens: Token[] = [];
    private start: number = 0;
    private current: number = 0;
    private line: number = 1;

    constructor(source: string) {
        this.source = source;
    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
        return this.tokens;
    }

    scanToken() {
        const c = this.advance();
        switch (c) {
            case "(":
                this.addToken(TokenType.L_PAREN);
                break;
            case ")":
                this.addToken(TokenType.R_PAREN);
                break;
            case "{":
                this.addToken(TokenType.L_BRACE);
                break;
            case "}":
                this.addToken(TokenType.R_BRACE);
                break;
            case ",":
                this.addToken(TokenType.COMMA);
                break;
            case "-":
                this.addToken(TokenType.MINUS);
                break;
            case "+":
                this.addToken(TokenType.PLUS);
                break;
            case ";":
                this.addToken(TokenType.SEMICOLON);
                break;
            case "*":
                this.addToken(TokenType.STAR);
                break;
            case "!":
                this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
                break;
            case "=":
                this.addToken(this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
                break;
            case "<":
                this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case ">":
                this.addToken(this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;     
            case "/":
                if (this.match("/")) {
                    while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
                } else {
                    this.addToken(TokenType.SLASH);
                }
                break;
            case " ":
            case "\r":
            case "\t":
                break;
            case "\n":
                this.line++;
                break;
            case '"': this.string();
                break;   
            default:
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                //TODO: error handler
                    Lox.error(this.line, "Unexpected character."); break;
                }
        }
    }

    private addToken(type: TokenType, literal: Object | null = null): Token[] {
        const value = this.source.substring(this.start, this.current);
        this.tokens.push(new Token(type, value, literal, this.line));
        return this.tokens;
    }

    private advance(): string {
        return this.source.charAt(this.current++)
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') ||
               (c >= 'A' && c <= 'Z') ||
                c == '_';
    }

    private isDigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    private isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private match(expected: string): boolean {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.current) != expected) return false;
        this.current++;
        return true;
    }

    private peek(): string {
        if (this.isAtEnd()) return "\0";
        return this.source.charAt(this.current);
    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) return "\0";
        return this.source.charAt(this.current);
    }

    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) this.advance();
        const value = this.source.substring(this.start, this.current);
        let type = keywords.get(value)
        if (type == null) type = TokenType.IDENTIFIER;
        this.addToken(type)
    }

    private number(): void { 
        while (this.isDigit(this.peek())) this.advance();
        if (this.peek() == "." && this.isDigit(this.peekNext())) {
            this.advance();
            while (this.isDigit(this.peek())) this.advance();
        }
        this.addToken(TokenType.NUMBER, Number.parseFloat(this.source.substring(this.start, this.current)))
    }

    private string(): void {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() == "\n") this.line++;
            this.advance()
        }
        if (this.isAtEnd()) {
            Lox.error(this.line, "Unterminated string.");
            return;
        }
        this.advance();
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, value)
    }
}

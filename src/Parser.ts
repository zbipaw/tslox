import { consumers } from "stream";
import { Expr, BinaryExpr, UnaryExpr, LiteralExpr, GroupingExpr } from "./gen/Expr";
import { ParseError } from "./Error";
import { Token } from "./Token";
import { TokenType } from "./TokenType";

export class Parser {
    private tokens: Token[] = [];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): Expr {
        try {
            return this.expression();
        } catch (error) {
            if (error instanceof ParseError) {
                throw new ParseError(this.peek(), "Expect any expression.")
            } else {
                throw new Error();
            }
        }
    }

    private expression(): Expr {
        return this.equality();
    }

    private equality(): Expr {
        let expr = this.comparison();
        while (this.match(TokenType.BANG, TokenType.BANG_EQUAL)) {
            const operator = this.previous();
            const right = this.comparison();
            expr = new BinaryExpr(expr, operator, right);
        }
        return expr
    }

    private comparison(): Expr {
        let expr = this.term();
        while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
            const operator = this.previous();
            const right = this.term();
            expr = new BinaryExpr(expr, operator, right);
        }
        return expr;
    }

    private term(): Expr {
        let expr = this.factor();
        while (this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator = this.previous();
            const right = this.factor();
            expr = new BinaryExpr(expr, operator, right);
        }
        return expr;
    }

    private factor(): Expr {
        let expr = this.unary();
        while (this.match(TokenType.SLASH, TokenType.STAR)) {
            const operator = this.previous();
            const right = this.unary();
            expr = new BinaryExpr(expr, operator, right);
        }
        return expr;
    }

    private unary(): Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator = this.previous();
            const right = this.unary();
            return new UnaryExpr(operator, right);
        }
        return this.primary();
    }

    private primary(): Expr {
        if (this.match(TokenType.FALSE)) return new LiteralExpr(false);
        if (this.match(TokenType.TRUE)) return new LiteralExpr(true);
        if (this.match(TokenType.NIL)) return new LiteralExpr(null);
        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            return new LiteralExpr(this.previous().literal ?? null);
        }
        if (this.match(TokenType.L_PAREN)) {
            let expr = this.expression();
            this.consume(TokenType.R_PAREN, "Expect ')' after expression.")
            return new GroupingExpr(expr)
        }
        throw new ParseError(this.peek(), "Expect any expression.");
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        } 
        return false;
    }
    
    private advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }
    
    private isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }
    
    private peek() {
        return this.tokens[this.current];
    }
    
    private previous() {
        return this.tokens[this.current - 1];
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();
        throw new ParseError(this.peek(), message);
    }

    private check(type: TokenType) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private synchronize(): void {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.previous().type == TokenType.SEMICOLON) return;
            switch (this.peek().type) {
                case TokenType.CLASS:
                case TokenType.FUN:
                case TokenType.VAR:
                case TokenType.FOR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.PRINT:
                case TokenType.RETURN:
                return;
          }
          this.advance();
        }
    }
}
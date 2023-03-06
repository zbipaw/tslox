import { 
    Expr, AssignExpr, BinaryExpr, UnaryExpr, LiteralExpr, GroupingExpr, VariableExpr 
} from "./gen/Expr";
import { 
    Stmt, ExpressionStmt, PrintStmt, VarStmt 
} from "./gen/Stmt";
import { ParseError } from "./Error";
import { Token } from "./Token";
import { TokenType } from "./TokenType";

export class Parser {
    private tokens: Token[] = [];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): Stmt[] {
        const statements: Stmt[] = [];
        while(!this.isAtEnd()) {
            statements.push(this.declaration())
        }
        return statements;
    }

    private expression(): Expr {
        return this.assignment();
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
        if (this.match(TokenType.IDENTIFIER)) {
            return new VariableExpr(this.previous());
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

    private printStatement(): Stmt {
        const value = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
        return new PrintStmt(value);
    }

    private expressionStatement(): Stmt {
        const expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
        return new ExpressionStmt(expr);
    }

    private statement(): Stmt {
        if (this.match(TokenType.PRINT)) return this.printStatement();
        return this.expressionStatement();
    }

    private declaration(): Stmt {
        try {
            if (this.match(TokenType.VAR)) return this.varDeclaration();
            return this.statement();
        } catch (error: any) {
            this.synchronize();
            throw new ParseError(this.peek(), error.message);
        }
    }

    private varDeclaration(): Stmt {
        const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");
        let initializer = null;
        if (this.match(TokenType.EQUAL)) {
            initializer = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return new VarStmt(name, initializer);
    }

    private assignment(): Expr {
        const expr = this.equality();
        if (this.match(TokenType.EQUAL)) {
            const equals = this.previous();
            const value = this.assignment();
            if (expr instanceof VariableExpr) {
                const name = expr.name;
                return new AssignExpr(name, value);
            }
            throw new ParseError(equals, "Invalid assignment target.");
        }
        return expr;
    }
}

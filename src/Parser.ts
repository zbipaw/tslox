import { 
    Expr, AssignExpr, BinaryExpr, UnaryExpr, LiteralExpr, GroupingExpr, VariableExpr, LogicalExpr, CallExpr, GetExpr, SetExpr, ThisExpr 
} from "./gen/Expr";
import { 
    Stmt, ExpressionStmt, PrintStmt, VarStmt, BlockStmt, IfStmt, WhileStmt, FunctionStmt, ReturnStmt, ClassStmt 
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

    private and(): Expr {
        let expr = this.equality();
        while (this.match(TokenType.AND)) {
            const operator = this.previous();
            const right = this.equality();
            expr = new LogicalExpr(expr, operator, right);
        }
        return expr;
    }

    private assignment(): Expr {
        const expr = this.or();
        if (this.match(TokenType.EQUAL)) {
            const equals = this.previous();
            const value = this.assignment();
            if (expr instanceof VariableExpr) {
                const name = expr.name;
                return new AssignExpr(name, value);
            } else if (expr instanceof GetExpr) {
                const get = expr as GetExpr;
                return new SetExpr(get.object, get.name, value);
            }
            throw new ParseError(equals, "Invalid assignment target.");
        }
        return expr;
    }

    private or(): Expr {
        let expr = this.and();
        while (this.match(TokenType.OR)) {
            const operator = this.previous();
            const right = this.and();
            expr = new LogicalExpr(expr, operator, right);
        }
        return expr;
    }

    private call(): Expr {
        let expr = this.primary();
        while(true) {
            if (this.match(TokenType.L_PAREN)) {
                expr = this.finishCall(expr);
            } else if (this.match(TokenType.DOT)) {
                const name = this.consume(TokenType.IDENTIFIER, "Expect property name after '.'.");
                expr = new GetExpr(expr, name);
            } else {
                break;
            }
        }
        return expr;
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

    private equality(): Expr {
        let expr = this.comparison();
        while (this.match(TokenType.BANG, TokenType.BANG_EQUAL)) {
            const operator = this.previous();
            const right = this.comparison();
            expr = new BinaryExpr(expr, operator, right);
        }
        return expr
    }

    private expression(): Expr {
        return this.assignment();
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

    private finishCall(callee: Expr): Expr {
        const args: Expr[] = [];
        if (!this.check(TokenType.R_PAREN)) {
            do {
                if (args.length >= 255) {
                    throw new ParseError(this.peek(), "Can't have more than 255 arguments.")
                }
                args.push(this.expression());
            } while (this.match(TokenType.COMMA));
        }
        const paren = this.consume(TokenType.R_PAREN, "Expect ')' after arguments.");
        return new CallExpr(callee, paren, args);
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

    private primary(): Expr {
        if (this.match(TokenType.FALSE)) return new LiteralExpr(false);
        if (this.match(TokenType.TRUE)) return new LiteralExpr(true);
        if (this.match(TokenType.NIL)) return new LiteralExpr(null);
        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            return new LiteralExpr(this.previous().literal ?? null);
        }
        if (this.match(TokenType.THIS)) return new ThisExpr(this.previous());
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

    private unary(): Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator = this.previous();
            const right = this.unary();
            return new UnaryExpr(operator, right);
        }
        return this.call();
    }

    private blockStatement(): Stmt[] {
        const statements = [];
        while(!this.check(TokenType.R_BRACE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }
        this.consume(TokenType.R_BRACE, "Expect '}' after block.");
        return statements;
    }

    private classDeclaration(): Stmt {
        const name = this.consume(TokenType.IDENTIFIER, "Expect class name.");
        this.consume(TokenType.L_BRACE, "Expect '{' before class body.");
        const methods: FunctionStmt[] = [];
        while (!this.check(TokenType.R_BRACE) && !this.isAtEnd()) {
            methods.push(this.functionStatement("method"));
        }
        this.consume(TokenType.R_BRACE, "Expect '}' after class body.");
        return new ClassStmt(name, methods);
    }

    private declaration(): Stmt {
        try {
            if (this.match(TokenType.CLASS)) return this.classDeclaration();
            if (this.match(TokenType.FUN)) return this.functionStatement("function");
            if (this.match(TokenType.VAR)) return this.varDeclaration();
            return this.statement();
        } catch (error: any) {
            this.synchronize();
            throw new ParseError(this.peek(), error.message);
        }
    }

    private expressionStatement(): Stmt {
        const expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
        return new ExpressionStmt(expr);
    }

    private forStatement(): Stmt {
        this.consume(TokenType.L_PAREN, "Expect '(' after 'for'.");
        let initializer;
        if (this.match(TokenType.SEMICOLON)) {
            initializer = null;
        } else if (this.match(TokenType.VAR)) {
            initializer = this.varDeclaration();
        } else {
            initializer = this.expressionStatement();
        }
        let condition = null;
        if (!this.check(TokenType.SEMICOLON)) {
            condition = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");
        let increment = null;
        if (!this.check(TokenType.R_PAREN)) {
            increment = this.expression();
        }
        this.consume(TokenType.R_PAREN, "Expect ')' after for clauses.");
        let body = this.statement();

        if (increment != null) {
            body = new BlockStmt([
                body, new ExpressionStmt(increment)
            ])
        }
        if (condition == null) condition = new LiteralExpr(true);
        body = new WhileStmt(condition, body);
        if (initializer != null) {
            body = new BlockStmt([initializer, body])
        }
        return body;
    }

    private functionStatement(kind: string): FunctionStmt {
        const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
        this.consume(TokenType.L_PAREN, `Expect ${kind} name.`);
        const parameters: Token[] = [];
        if (!this.check(TokenType.R_PAREN)) {
            do {
                if (parameters.length >= 255) {
                    throw new ParseError(this.peek(), "Can't have more than 255 parameters.");
                }
                parameters.push(
                    this.consume(TokenType.IDENTIFIER, "Expect parameter name.")
                );
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.R_PAREN, "Expect ')' after parameters.");
        this.consume(TokenType.L_BRACE, `Expect '{' before ${kind} body.`);
        const body: Stmt[] = this.blockStatement();
        return new FunctionStmt(name, parameters, body);
    }

    private ifStatement(): Stmt {
        this.consume(TokenType.L_PAREN, "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume(TokenType.R_PAREN, "Expect ')' after 'if' condition.");
        const thenBranch = this.statement();
        let elseBranch = null;
        if (this.match(TokenType.ELSE)) {
            elseBranch = this.statement();
        }
        return new IfStmt(condition, thenBranch, elseBranch);
    }

    private printStatement(): Stmt {
        const value = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
        return new PrintStmt(value);
    }

    private returnStatement(): Stmt {
        const keyword = this.previous();
        let value = null;
        if(!this.check(TokenType.SEMICOLON)) {
            value = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
        return new ReturnStmt(keyword, value);
    }

    private statement(): Stmt {
        if (this.match(TokenType.FOR)) return this.forStatement();
        if (this.match(TokenType.IF)) return this.ifStatement();
        if (this.match(TokenType.PRINT)) return this.printStatement();
        if (this.match(TokenType.RETURN)) return this.returnStatement();
        if (this.match(TokenType.WHILE)) return this.whileStatement();
        if (this.match(TokenType.L_BRACE)) return new BlockStmt(this.blockStatement());
        return this.expressionStatement();
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

    private whileStatement(): Stmt {
        this.consume(TokenType.L_PAREN, "Expect '(' after 'while'.");
        const condition = this.expression();
        this.consume(TokenType.R_PAREN, "Expect ')' after condition.");
        const body = this.statement();
        return new WhileStmt(condition, body);
    }

    private advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private check(type: TokenType) {
        if (this.isAtEnd()) return false;
        return this.peek().type == type;
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();
        throw new ParseError(this.peek(), message);
    }

    private isAtEnd() {
        return this.peek().type == TokenType.EOF;
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

    private peek() {
        return this.tokens[this.current];
    }
    
    private previous() {
        return this.tokens[this.current - 1];
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

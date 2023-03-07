import { ResolveError } from "./Error";
import { AssignExpr, BinaryExpr, CallExpr, Expr, ExprVisitor, GroupingExpr, LiteralExpr, LogicalExpr, UnaryExpr, VariableExpr } from "./gen/Expr";
import { BlockStmt, ExpressionStmt, FunctionStmt, IfStmt, PrintStmt, ReturnStmt, Stmt, StmtVisitor, VarStmt, WhileStmt } from "./gen/Stmt";
import { Interpreter } from "./Interpreter";
import { Token } from "./Token";

enum FunctionType { NONE, FUNCTION };

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
    private interpreter: Interpreter;
    private scopes: Record<string, boolean>[] = [];
    private currentFunc: FunctionType = FunctionType.NONE;

    constructor(interpreter: Interpreter) {
        this.interpreter = interpreter;
    }

    visitAssignExpr(expr: AssignExpr): void {
        this.resolveExpr(expr.value);
        this.resolveLocal(expr, expr.name);
    }

    visitBinaryExpr(expr: BinaryExpr): void {
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }

    visitBlockStmt(stmt: BlockStmt): void {
        this.beginScope();
        this.resolveStmt(stmt.statements);
        this.endScope();
    }

    visitCallExpr(expr: CallExpr): void {
        this.resolveExpr(expr.callee);
        for (let arg of expr.args) {
            this.resolveExpr(arg);
        }
    }

    visitExpressionStmt(stmt: ExpressionStmt): void {
        this.resolveExpr(stmt.expression);
    }

    visitIfStmt(stmt: IfStmt): void {
        this.resolveExpr(stmt.condition);
        this.resolveStmt(stmt.thenBranch);
        if(stmt.elseBranch != null) this.resolveStmt(stmt.elseBranch);
    }

    visitFunctionStmt(stmt: FunctionStmt): void {
        this.declare(stmt.name);
        this.define(stmt.name);
        this.resolveFunction(stmt, FunctionType.FUNCTION);
    }

    visitGroupingExpr(expr: GroupingExpr): void {
        this.resolveExpr(expr.expression);
    }

    visitLiteralExpr(expr: LiteralExpr): void { }

    visitLogicalExpr(expr: LogicalExpr): void { 
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }

    visitPrintStmt(stmt: PrintStmt): void {
        this.resolveExpr(stmt.expression);
    }

    visitReturnStmt(stmt: ReturnStmt): void {
        if (this.currentFunc == FunctionType.NONE) {
            throw new ResolveError(stmt.keyword, "Can't return from top-level code.");
        }
        if (stmt.value != null) {
            this.resolveExpr(stmt.value);
        }
    }

    visitUnaryExpr(expr: UnaryExpr): void {
        this.resolveExpr(expr.right);
    }

    visitVarStmt(stmt: VarStmt): void {
        this.declare(stmt.name);
        if (stmt.initializer != null) {
            this.resolveExpr(stmt.initializer);
        }
        this.define(stmt.name);
    }

    visitVariableExpr(expr: VariableExpr): void {
        if (this.scopes.length && this.scopes.at(-1)?.[expr.name.lexeme] == false) {
            throw new ResolveError(expr.name, "Can't read local variable in its own initializer.");
        }
        this.resolveLocal(expr, expr.name);
    }

    visitWhileStmt(stmt: WhileStmt): void {
        this.resolveExpr(stmt.condition);
        this.resolveStmt(stmt.body);
    }

    private declare(name: Token): void {
        if (!this.scopes.length) return;
        const scope = this.scopes.at(-1);
        if (Object.keys(scope as Record<string, boolean>).includes(name.lexeme)){
            throw new ResolveError(name, "Already a variable with this name in this scope.");
        }
        if (scope) scope[name.lexeme] = false;
    }

    private define(name: Token): void {
        if (!this.scopes.length) return;
        const scope = this.scopes.at(-1);
        if (scope) scope[name.lexeme] = true;
    }

    private beginScope(): void {
        this.scopes.push({});
    }
    
    private endScope(): void {
        this.scopes.pop();
    }

    private resolveExpr(expr: Expr): void {
        expr.accept(this);
    }

    private resolveFunction(func: FunctionStmt, type: FunctionType) {
        const enclosingFunc = this.currentFunc;
        this.currentFunc = type;

        this.beginScope();
        for (let param of func.params) {
            this.declare(param);
            this.define(param);
        }
        this.resolveStmt(func.body);
        this.endScope();
        this.currentFunc = enclosingFunc;
    }

    private resolveLocal(expr: Expr, name: Token): void {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (Object.keys(this.scopes[i]).includes(name.lexeme)) {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i);
                return;
            }
        }
    }

    resolveStmt(statements: Stmt | Stmt[]): void {
        if (!Array.isArray(statements)) {
            return statements.accept(this);
        }
        for (let stmt of statements) {
            stmt.accept(this);
        }
    }
}
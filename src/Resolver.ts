import { ResolveError } from "./Error";
import { AssignExpr, BinaryExpr, CallExpr, Expr, ExprVisitor, GetExpr, GroupingExpr, LiteralExpr, LogicalExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "./gen/Expr";
import { BlockStmt, ClassStmt, ExpressionStmt, FunctionStmt, IfStmt, PrintStmt, ReturnStmt, Stmt, StmtVisitor, VarStmt, WhileStmt } from "./gen/Stmt";
import { Interpreter } from "./Interpreter";
import { Token } from "./Token";

enum ClassType { NONE, CLASS };
enum FunctionType { NONE, FUNCTION, INITIALIZER, METHOD };

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
    private interpreter: Interpreter;
    private scopes: Map<string, boolean>[] = [];
    private currentClass: ClassType = ClassType.NONE;
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

    visitClassStmt(stmt: ClassStmt): void {
        const enclosingClass = this.currentClass;
        this.currentClass = ClassType.CLASS;
        this.declare(stmt.name);
        this.define(stmt.name);
        this.beginScope();
        this.scopes[this.scopes.length - 1].set("this", true);
        for (let method of stmt.methods) {
            let declaration = FunctionType.METHOD;
            if (method.name.lexeme === "init") {
                declaration = FunctionType.INITIALIZER;
            }
            this.resolveFunction(method, declaration);
        }
        this.endScope();
        this.currentClass = enclosingClass;
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

    visitGetExpr(expr: GetExpr): void {
        this.resolveExpr(expr.object);
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
            if (this.currentFunc == FunctionType.INITIALIZER) {
                throw new ResolveError(stmt.keyword, "Can't return a value from an initializer.");
            }
            this.resolveExpr(stmt.value);
        }
    }

    visitSetExpr(expr: SetExpr): void {
        this.resolveExpr(expr.value);
        this.resolveExpr(expr.object);
    }

    visitThisExpr(expr: ThisExpr): void {
        if (this.currentClass == ClassType.NONE) {
            throw new ResolveError(expr.keyword, "Can't use 'this' outside of a class.");
        }
        this.resolveLocal(expr, expr.keyword);
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
        if (this.scopes.length && this.scopes.at(-1)?.get(expr.name.lexeme) == false) {
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
        if (scope?.has(name.lexeme)){
            throw new ResolveError(name, "Already a variable with this name in this scope.");
        }
        if (scope) scope.set(name.lexeme, false);
    }

    private define(name: Token): void {
        if (!this.scopes.length) return;
        const scope = this.scopes.at(-1);
        if (scope) scope.set(name.lexeme, true);
    }

    private beginScope(): void {
        this.scopes.push(new Map());
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
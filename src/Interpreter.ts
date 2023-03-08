import { 
    Expr, ExprVisitor, BinaryExpr, UnaryExpr, LiteralExpr, GroupingExpr, VariableExpr, AssignExpr, LogicalExpr, CallExpr, GetExpr, SetExpr, ThisExpr, SuperExpr 
} from "./gen/Expr";
import { 
    Stmt, StmtVisitor, ExpressionStmt, PrintStmt, VarStmt, BlockStmt, IfStmt, WhileStmt, FunctionStmt, ReturnStmt, ClassStmt
} from "./gen/Stmt";
import { Token } from "./Token";
import { TokenType } from "./TokenType";
import { RuntimeError } from "./Error";
import { Environment } from "./Environment";
import { Callable } from "./Callable";
import { Function } from "./Function";
import { Return } from "./Return";
import { Nullable } from "./Types";
import { Klass } from "./Klass";
import { Instance } from "./Instance";

export class Interpreter implements ExprVisitor<Nullable<Object>>, StmtVisitor<void> {
    globals: Environment = new Environment();
    locals: Map<Expr, number> = new Map();
    private environment = this.globals;

    constructor() {
        const clock: Callable & { toString: () => string } = {
                arity: () => 0,
                call: () => Date.now(),
                toString: () => "<native function>",
            };
        this.globals.define("clock", clock);
    }

    execute(stmt: Stmt): void {
        return stmt.accept(this);
    }

    executeBlock(statements: Stmt[], environment: Environment): void {
        const previous = this.environment;
        try {
            this.environment = environment;
            for (let stmt of statements) {
                this.execute(stmt);
            }
        } finally {
            this.environment = previous;
        }
    }

    interpret(statements: Stmt[]): void {
        try {
            for(let stmt of statements) {
                this.execute(stmt);
            }
        } catch (error) {
            if (error instanceof RuntimeError)
                console.error(error.message);
        }
    }

    resolve(expr: Expr, depth: number): void {
        this.locals.set(expr, depth);
    }
    
    visitAssignExpr(expr: AssignExpr) {
        const value = this.evaluate(expr.value);
        const dist = this.locals.get(expr);
        if (dist != null) {
            this.environment.assignAt(dist, expr.name, value);
        } else {
            this.globals.assign(expr.name, value);
        }
        return value;
    }

    visitBinaryExpr(expr: BinaryExpr) {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case TokenType.PLUS:
                if (typeof left == "number" && typeof right == "number") {
                    return left + right;
                }
                if (typeof left == "string" && typeof right == "string") {
                    return `${left}${right}`;
                }
                throw new RuntimeError(expr.operator, "Operands must be 2 numbers or string.")
            case TokenType.MINUS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) - Number(right);
            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) * Number(right);
            case TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) / Number(right);
            case TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) > Number(right);
            case TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) >= Number(right);
            case TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) < Number(right);
            case TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) <= Number(right); 
            case TokenType.BANG_EQUAL: return !this.isEqual(left, right);
            case TokenType.EQUAL_EQUAL: return this.isEqual(left, right);           
        }
        throw new RuntimeError(expr.operator, "Unknown token type used as binary operator.")
    }

    visitCallExpr(expr: CallExpr) {
        const callee = this.evaluate(expr.callee);
        const args: Expr[] = [];
        for (let arg of expr.args) {
            args.push(this.evaluate(arg));
        }
        if (!this.isCallable(callee)) {
            throw new RuntimeError(expr.paren, "Can call only function and classes.");
        }
        const func: Callable = callee;
        if (args.length != func.arity()) {
            throw new RuntimeError(
                expr.paren, `Expected ${func.arity()} arguments but got ${args.length}.`
            )
        }
        return func.call(this, args);
    }

    visitGetExpr(expr: GetExpr) {
        const object = this.evaluate(expr.object);
        if (object instanceof Instance) {
            return (object as Instance).get(expr.name);
        }
        throw new RuntimeError(expr.name, "Only instances have properties.");
    }

    visitGroupingExpr(expr: GroupingExpr) {
        return this.evaluate(expr.expression);
    }

    visitLiteralExpr(expr: LiteralExpr) {
        return expr.value;
    }

    visitLogicalExpr(expr: LogicalExpr) {
        const left = this.evaluate(expr.left);
        if (expr.operator.type == TokenType.OR) {
            if (this.isTruthy(left)) return left;
        } else {
            if (!this.isTruthy(left)) return left;
        }
        return this.evaluate(expr.right);
    }

    visitSetExpr(expr: SetExpr) {
        const object = this.evaluate(expr.object);
        if(!(object instanceof Instance)) {
            throw new RuntimeError(expr.name, "Only instances have fields.");
        }
        const value = this.evaluate(expr.value);
        (object as Instance).set(expr.name, value);
        return value;
    }

    visitSuperExpr(expr: SuperExpr) {
        const dist = this.locals.get(expr) as number;
        const superklass = this.environment.getAt(dist, "super") as Klass;
        const object = this.environment.getAt(dist - 1, "this") as Instance;
        const method = superklass.findMethod(expr.method.lexeme);
        if (method === null) {
            throw new RuntimeError(expr.method, `Undefined property ' + ${expr.method.lexeme} + '.`);
        }
        return method.bind(object);
    }

    visitThisExpr(expr: ThisExpr) {
        return this.lookupVariable(expr.keyword, expr);
    }

    visitUnaryExpr(expr: UnaryExpr) {
        const right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case TokenType.BANG:
                return !this.isTruthy(right);
            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right);
                return -Number(right);
        }
        throw new RuntimeError(expr.operator, "Unknown token type used as unary operator.");
    }

    visitVariableExpr(expr: VariableExpr) {
        return this.lookupVariable(expr.name, expr);
    }

    visitBlockStmt(stmt: BlockStmt): void {
        this.executeBlock(stmt.statements, new Environment(this.environment));
    }

    visitClassStmt(stmt: ClassStmt): void {
        let superklass = null;
        if (stmt.superklass !== null) {
            superklass = this.evaluate(stmt.superklass);
            if (!(superklass instanceof Klass)) {
                throw new RuntimeError(stmt.superklass.name, "Superclass must be a class.");
            }
        }
        this.environment.define(stmt.name.lexeme, null);
        if (stmt.superklass != null) {
            const environment = new Environment(this.environment);
            environment.define("super", superklass);
        }
        const methods = new Map<string, Function>();
        for (let method of stmt.methods) {
            const isInitializer = method.name.lexeme === "init";
            const func = new Function(method, this.environment, isInitializer);
            methods.set(method.name.lexeme, func);
        }
        const klass = new Klass(stmt.name.lexeme, superklass as Klass, methods);
        if (superklass !== null && this.environment.enclosing !== null) {
            this.environment = this.environment.enclosing;
        }
        this.environment.assign(stmt.name, klass);
    }

    visitExpressionStmt(stmt: ExpressionStmt): void {
        this.evaluate(stmt.expression);
    }

    visitFunctionStmt(stmt: FunctionStmt): void {
        const func: Function = new Function(stmt, this.environment, false);
        this.environment.define(stmt.name.lexeme, func);
    }

    visitIfStmt(stmt: IfStmt): void {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch != null) {
            this.execute(stmt.elseBranch);
        }
    }

    visitPrintStmt(stmt: PrintStmt): void {
        const value = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
    }

    visitReturnStmt(stmt: ReturnStmt): void {
        let value = null;
        if (stmt.value !== null) {
            value = this.evaluate(stmt.value);
        }
        throw new Return(value);    //control flow
    }

    visitVarStmt(stmt: VarStmt): void {
        let value = null;
        if (stmt.initializer != null) {
            value = this.evaluate(stmt.initializer);
        }
        this.environment.define(stmt.name.lexeme, value);
    }

    visitWhileStmt(stmt: WhileStmt): void {
        while(this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }
    }

    private checkNumberOperand(operator: Token, operand: Object): void {
        if (typeof operand == "number") return;
        throw new RuntimeError(operator, "Operand must be a number.")
    }

    private checkNumberOperands(operator: Token, left: Object, right: Object): void {
        if (typeof left == "number" && typeof right == "number") return;
        throw new RuntimeError(operator, "Operand must be a numbers.")
    }

    private evaluate(expr: Expr): any {
        return expr.accept(this);
    }

    private isTruthy(value: Object): boolean {
        return !!value;
    }

    private isEqual(a: Object, b: Object): boolean {
        return a == b;
    }

    private isCallable(obj: any): boolean {
        return obj.call != undefined;
    }

    private lookupVariable(name: Token, expr: Expr): Nullable<Object> {
        const dist = this.locals.get(expr);
        if (dist != null) {
            return this.environment.getAt(dist, name.lexeme);
        } else {
            return this.globals.get(name);
        }
    }

    private stringify(lit: Object): string {
        if (lit === null) return "nil";
        if (typeof lit == "number") {
            let text = lit.toString();
            if (text.endsWith(".0")) {
                text = text.substring(0, text.length - 2);
            }
            return text;
        }
        return lit.toString();
    }
}

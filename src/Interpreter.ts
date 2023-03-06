import { 
    Expr, ExprVisitor, BinaryExpr, UnaryExpr, LiteralExpr, GroupingExpr, VariableExpr, AssignExpr 
} from "./gen/Expr";
import { 
    Stmt, StmtVisitor, ExpressionStmt, PrintStmt, VarStmt
} from "./gen/Stmt";
import { Token } from "./Token";
import { TokenType } from "./TokenType";
import { RuntimeError } from "./Error";
import { Environment } from "./Environment";

export class Interpreter implements ExprVisitor<Object | null>, StmtVisitor<void> {
    private environment = new Environment();

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

    visitLiteralExpr(expr: LiteralExpr) {
        return expr.value;
    }

    visitGroupingExpr(expr: GroupingExpr) {
        return this.evaluate(expr.expression);
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
        throw new RuntimeError(expr.operator, "Unknown token type used as unary operator.")
    }
    
    visitBinaryExpr(expr: BinaryExpr) {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case TokenType.PLUS:
                if (typeof left === "number" && typeof right === "number") {
                    return left + right;
                }
                if (typeof left === "string" && typeof right === "string") {
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

    visitVariableExpr(expr: VariableExpr) {
        return this.environment.get(expr.name);
    }

    visitAssignExpr(expr: AssignExpr) {
        const value = this.evaluate(expr.value);
        this.environment.assign(expr.name, value);
        return value;
    }

    visitExpressionStmt(stmt: ExpressionStmt): void {
        this.evaluate(stmt.expression);
    }

    visitPrintStmt(stmt: PrintStmt): void {
        const value = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
    }

    visitVarStmt(stmt: VarStmt): void {
        let value = null;
        if (stmt.initializer != null) {
            value = this.evaluate(stmt.initializer);
        }
        this.environment.define(stmt.name.lexeme, value);
    }

    private execute(stmt: Stmt): void {
        return stmt.accept(this);
    }

    private evaluate(expr: Expr): any {
        return expr.accept(this);
    }

    private isTruthy(value: Object): boolean {
        return !!value;
    }

    private isEqual(a: Object, b: Object) {
        return a === b;
    }

    private checkNumberOperand(operator: Token, operand: Object): void {
        if (typeof operand === "number") return;
        throw new RuntimeError(operator, "Operand must be a number.")
    }

    private checkNumberOperands(operator: Token, left: Object, right: Object): void {
        if (typeof left === "number" && typeof right === "number") return;
        throw new RuntimeError(operator, "Operand must be a numbers.")
    }

    private stringify(lit: Object): string {
        if (lit === null) return "nil";
        if (typeof lit === "number") {
            let text = lit.toString();
            if (text.endsWith(".0")) {
                text = text.substring(0, text.length - 2);
            }
            return text;
        }
        return lit.toString();
    }
}

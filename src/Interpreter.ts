import { 
    Expr, ExprVisitor, BinaryExpr, UnaryExpr, LiteralExpr, GroupingExpr 
} from "./gen/Expr";
import { Literal, Token } from "./Token";
import { TokenType } from "./TokenType";
import { RuntimeError } from "./Error";

export class Interpreter implements ExprVisitor<Literal> {
    interpret(expr: Expr) {
        try {
            const value = this.evaluate(expr);
            console.log(this.stringify(value));
        } catch (error) {
            if (error instanceof RuntimeError)
                console.error(error.message);
        }
    }

    visitLiteralExpr(expr: LiteralExpr): Literal {
        return expr.value;
    }

    visitGroupingExpr(expr: GroupingExpr): Literal {
        return this.evaluate(expr.expression);
    }

    visitUnaryExpr(expr: UnaryExpr): Literal {
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
    
    visitBinaryExpr(expr: BinaryExpr): Literal {
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

    private evaluate(expr: Expr): Literal {
        return expr.accept(this);
    }

    private isTruthy(value: Literal): boolean {
        return !!value;
    }

    private isEqual(a: Literal, b: Literal) {
        return a === b;
    }

    private checkNumberOperand(operator: Token, operand: Literal): void {
        if (typeof operand === "number") return;
        throw new RuntimeError(operator, "Operand must be a number.")
    }

    private checkNumberOperands(operator: Token, left: Literal, right: Literal): void {
        if (typeof left === "number" && typeof right === "number") return;
        throw new RuntimeError(operator, "Operand must be a numbers.")
    }

    private stringify(lit: Literal): string {
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

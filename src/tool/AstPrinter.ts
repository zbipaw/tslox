import * as expr from "../gen/Expr";

export class AstPrinter implements expr.ExprVisitor<string> {
    print(e: expr.Expr): string {
        return e.accept(this);
    }

    public visitBinaryExpr(e: expr.BinaryExpr): string {
        return this.parenthesize(e.operator.lexeme, e.left, e.right);
    }

    public visitGroupingExpr(e: expr.GroupingExpr) {
        return this.parenthesize("group", e.expression);
      }
    
    public visitLiteralExpr(e: expr.LiteralExpr) {
        if (e.value == null) return "nil";
        return e.value.toString();
    }
    
    public visitUnaryExpr(e: expr.UnaryExpr) {
        return this.parenthesize(e.operator.lexeme, e.right);
    }

    private parenthesize(name: string, ...expressions: expr.Expr[]): string {
        return `(${name} ${expressions.map((e) => e.accept(this)).join(" ")})`;
    }
}

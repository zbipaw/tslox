import { 
    Expr, ExprVisitor, BinaryExpr, GroupingExpr, LiteralExpr, UnaryExpr 
} from "../gen/Expr";

export class AstPrinter implements ExprVisitor<string> {
    print(e: Expr): string {
        return e.accept(this);
    }

    public visitBinaryExpr(e: BinaryExpr): string {
        return this.parenthesize(e.operator.lexeme, e.left, e.right);
    }

    public visitGroupingExpr(e: GroupingExpr) {
        return this.parenthesize("group", e.expression);
      }
    
    public visitLiteralExpr(e: LiteralExpr) {
        if (e.value == null) return "nil";
        return e.value.toString();
    }
    
    public visitUnaryExpr(e: UnaryExpr) {
        return this.parenthesize(e.operator.lexeme, e.right);
    }

    private parenthesize(name: string, ...expressions: Expr[]): string {
        return `(${name} ${expressions.map((e) => e.accept(this)).join(" ")})`;
    }
}

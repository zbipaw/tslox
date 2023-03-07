import { Token } from '../Token';
import { Nullable } from '../Types';

export interface ExprVisitor<T> {
    visitAssignExpr: (expr: AssignExpr) => T;
    visitBinaryExpr: (expr: BinaryExpr) => T;
    visitCallExpr: (expr: CallExpr) => T;
    visitGetExpr: (expr: GetExpr) => T;
    visitGroupingExpr: (expr: GroupingExpr) => T;
    visitLiteralExpr: (expr: LiteralExpr) => T;
    visitLogicalExpr: (expr: LogicalExpr) => T;
    visitSetExpr: (expr: SetExpr) => T;
    visitUnaryExpr: (expr: UnaryExpr) => T;
    visitVariableExpr: (expr: VariableExpr) => T;
}

export abstract class Expr {
    abstract accept: <T>(visitor: ExprVisitor<T>) => T;
}

export class AssignExpr implements Expr {
    name: Token;
    value: Expr;

  constructor(name: Token, value: Expr) {
    this.name = name;
    this.value = value;
    }

    accept<T>(visitor: ExprVisitor<T>): T {
        return visitor.visitAssignExpr(this);
    }
}

export class BinaryExpr implements Expr {
    left: Expr;
    operator: Token;
    right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left;
    this.operator = operator;
    this.right = right;
    }

    accept<T>(visitor: ExprVisitor<T>): T {
        return visitor.visitBinaryExpr(this);
    }
}

export class CallExpr implements Expr {
    callee: Expr;
    paren: Token;
    args: Expr[];

  constructor(callee: Expr, paren: Token, args: Expr[]) {
    this.callee = callee;
    this.paren = paren;
    this.args = args;
    }

    accept<T>(visitor: ExprVisitor<T>): T {
        return visitor.visitCallExpr(this);
    }
}

export class GetExpr implements Expr {
    object: Expr;
    name: Token;

  constructor(object: Expr, name: Token) {
    this.object = object;
    this.name = name;
    }

    accept<T>(visitor: ExprVisitor<T>): T {
        return visitor.visitGetExpr(this);
    }
}

export class GroupingExpr implements Expr {
    expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
    }

    accept<T>(visitor: ExprVisitor<T>): T {
        return visitor.visitGroupingExpr(this);
    }
}

export class LiteralExpr implements Expr {
    value: Nullable<Object>;

  constructor(value: Nullable<Object>) {
    this.value = value;
    }

    accept<T>(visitor: ExprVisitor<T>): T {
        return visitor.visitLiteralExpr(this);
    }
}

export class LogicalExpr implements Expr {
    left: Expr;
    operator: Token;
    right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left;
    this.operator = operator;
    this.right = right;
    }

    accept<T>(visitor: ExprVisitor<T>): T {
        return visitor.visitLogicalExpr(this);
    }
}

export class SetExpr implements Expr {
    object: Expr;
    name: Token;
    value: Expr;

  constructor(object: Expr, name: Token, value: Expr) {
    this.object = object;
    this.name = name;
    this.value = value;
    }

    accept<T>(visitor: ExprVisitor<T>): T {
        return visitor.visitSetExpr(this);
    }
}

export class UnaryExpr implements Expr {
    operator: Token;
    right: Expr;

  constructor(operator: Token, right: Expr) {
    this.operator = operator;
    this.right = right;
    }

    accept<T>(visitor: ExprVisitor<T>): T {
        return visitor.visitUnaryExpr(this);
    }
}

export class VariableExpr implements Expr {
    name: Token;

  constructor(name: Token) {
    this.name = name;
    }

    accept<T>(visitor: ExprVisitor<T>): T {
        return visitor.visitVariableExpr(this);
    }
}


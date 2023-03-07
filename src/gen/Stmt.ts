import { Expr } from './Expr';
import { Token } from '../Token';
import { Nullable } from '../Types';

export interface StmtVisitor<T> {
    visitBlockStmt: (stmt: BlockStmt) => T;
    visitClassStmt: (stmt: ClassStmt) => T;
    visitExpressionStmt: (stmt: ExpressionStmt) => T;
    visitFunctionStmt: (stmt: FunctionStmt) => T;
    visitIfStmt: (stmt: IfStmt) => T;
    visitPrintStmt: (stmt: PrintStmt) => T;
    visitReturnStmt: (stmt: ReturnStmt) => T;
    visitVarStmt: (stmt: VarStmt) => T;
    visitWhileStmt: (stmt: WhileStmt) => T;
}

export abstract class Stmt {
    abstract accept: <T>(visitor: StmtVisitor<T>) => T;
}

export class BlockStmt implements Stmt {
    statements: Stmt[];

  constructor(statements: Stmt[]) {
    this.statements = statements;
    }

    accept<T>(visitor: StmtVisitor<T>): T {
        return visitor.visitBlockStmt(this);
    }
}

export class ClassStmt implements Stmt {
    name: Token;
    methods: FunctionStmt[];

  constructor(name: Token, methods: FunctionStmt[]) {
    this.name = name;
    this.methods = methods;
    }

    accept<T>(visitor: StmtVisitor<T>): T {
        return visitor.visitClassStmt(this);
    }
}

export class ExpressionStmt implements Stmt {
    expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
    }

    accept<T>(visitor: StmtVisitor<T>): T {
        return visitor.visitExpressionStmt(this);
    }
}

export class FunctionStmt implements Stmt {
    name: Token;
    params: Token[];
    body: Stmt[];

  constructor(name: Token, params: Token[], body: Stmt[]) {
    this.name = name;
    this.params = params;
    this.body = body;
    }

    accept<T>(visitor: StmtVisitor<T>): T {
        return visitor.visitFunctionStmt(this);
    }
}

export class IfStmt implements Stmt {
    condition: Expr;
    thenBranch: Stmt;
    elseBranch: Nullable<Stmt>;

  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Nullable<Stmt>) {
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
    }

    accept<T>(visitor: StmtVisitor<T>): T {
        return visitor.visitIfStmt(this);
    }
}

export class PrintStmt implements Stmt {
    expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
    }

    accept<T>(visitor: StmtVisitor<T>): T {
        return visitor.visitPrintStmt(this);
    }
}

export class ReturnStmt implements Stmt {
    keyword: Token;
    value: Nullable<Expr>;

  constructor(keyword: Token, value: Nullable<Expr>) {
    this.keyword = keyword;
    this.value = value;
    }

    accept<T>(visitor: StmtVisitor<T>): T {
        return visitor.visitReturnStmt(this);
    }
}

export class VarStmt implements Stmt {
    name: Token;
    initializer: Nullable<Expr>;

  constructor(name: Token, initializer: Nullable<Expr>) {
    this.name = name;
    this.initializer = initializer;
    }

    accept<T>(visitor: StmtVisitor<T>): T {
        return visitor.visitVarStmt(this);
    }
}

export class WhileStmt implements Stmt {
    condition: Expr;
    body: Stmt;

  constructor(condition: Expr, body: Stmt) {
    this.condition = condition;
    this.body = body;
    }

    accept<T>(visitor: StmtVisitor<T>): T {
        return visitor.visitWhileStmt(this);
    }
}


import { writeFileSync } from "fs";

class AstGenerator {
    public static main(): void {
        const args = process.argv.slice(2);
        if (args.length != 1) {
            console.log("Usage: AstGenerator.ts <output directory>");
            process.exit(64);
        }
        const outputDir = args[0];

        this.defineAst(outputDir, "Expr", [
            "Assign   - name: Token, value: Expr",
            "Binary   - left: Expr, operator: Token, right: Expr",
            "Grouping - expression: Expr",
            "Literal  - value: Literal",
            "Unary    - operator: Token, right: Expr",
            "Variable - name: Token",
        ], [
            "import { Literal, Token } from '../Token';"
        ]);
        this.defineAst(outputDir, "Stmt", [
            "Expression - expression: Expr",
            "Print      - expression: Expr",
            "Var        - name: Token, initializer: Expr | null",
        ], [
            "import { Expr } from './Expr';",
            "import { Literal, Token } from '../Token';"
        ]);
    }

    private static defineAst(outputDir: string, baseName: string, types: string[], headers: string[]): void {
        const path = `${outputDir}\\${baseName}.ts`;
        let content = `${headers.join("\n")}\n\n`
        content += this.defineVisitor(baseName, types);
        content += this.defineAbstract(baseName);
        types.forEach ((type) => {
            const className = type.split("-")[0].trim();
            const fields = type.split("-")[1].trim();
            content += this.defineType(baseName, className, fields)
        });
        writeFileSync(path, content, {flag:'w+'});
    }

    private static defineVisitor(baseName: string, types: string[]): string {
        let content = `export interface ${baseName}Visitor<T> {\n`;
        types.forEach(type => {
            const typeName = type.split("-")[0].trim();
            content += `    visit${typeName}${baseName}: (${baseName.toLowerCase()}: ${typeName}${baseName}) => T;\n`;
        });
        content += '}\n\n';
        return content;
    }

    private static defineAbstract(baseName: string): string {
        let content = `export abstract class ${baseName} {\n`;
        content += `    abstract accept: <T>(visitor: ${baseName}Visitor<T>) => T;\n`;
        content += `}\n\n`;
        return content;
    }

    private static defineType(baseName: string, className: string, fields: string): string {
        let content = `export class ${className}${baseName} implements ${baseName} {\n`
        const classFields = fields.split(', ')
        classFields.forEach((field) => {
            content += `    ${field};\n`
        });
        content += "\n";
        content += `  constructor(${fields}) {\n`;
        classFields.forEach((field) => {
            const name = field.split(":")[0].trim().replace("?", "");
            content += `    this.${name} = ${name};\n`;
        });
        content += `    }\n\n`;
        content += `    accept<T>(visitor: ${baseName}Visitor<T>): T {\n`;
        content += `        return visitor.visit${className}${baseName}(this);\n`;
        content += `    }\n`;
        content += '}\n';
        return content;
    }
}

AstGenerator.main();

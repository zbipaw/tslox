import { readFileSync } from "fs";
import { mainModule } from "process";
import { createInterface } from "readline";

import { Parser } from "./Parser";
import { Scanner } from "./Scanner"
import { AstPrinter } from "./tool/AstPrinter";

export class Lox {
    static hadError = false;
    static hadRuntimeError = false;

    public static main(args: string[]): void {
        if (args.length > 1) {
            console.log("Usage: jlox [script]" + " ");
            process.exit(64);
        } else if (args.length == 1) {
            this.runFile(args[0]);
        } else {
            this.runREPL();
        }
    }

    private static runFile(path: string): void {
        const fileBuffer = readFileSync(path);
        this.run(fileBuffer.toString());
        if (this.hadError) process.exit(65);
        if (this.hadRuntimeError) process.exit(70);
    }

    private static runREPL(): void {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: "[lox]:" + " ",
        });
        rl.prompt();
        rl.on("line", (input) => {
            this.hadError = false;
            input = input.trim()
            if (input === "exit") {
                rl.close()
            }
            if (input) {
                try {
                    this.run(input)
                } catch (error: any) {
                    this.hadError = true;
                    console.error(error.message)
                }
            }
            console.log()
            rl.prompt();
        });
        rl.on("close", () => {
            console.log("Exit")
            process.exit(0)
        });
        rl.prompt();
    }

    private static run(source: string): void {
        const scanner = new Scanner(source);
        const tokens = scanner.scanTokens();
        const parser = new Parser(tokens);
        const expression = parser.parse();
        
        if (this.hadError) return;
        console.log(new AstPrinter().print(expression));
    }
}

//force cli
Lox.main(process.argv.slice(2));

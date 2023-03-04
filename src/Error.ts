import { Token } from "./Token"

export class ScanError implements Error {
    constructor(
        public readonly line: number,
        public readonly message: string,
        public readonly name: string = "Scanner error"
    ) { }
    public toString(): string {
        return `${this.name}: ${this.message} @ ${this.line.toString()}`
    }
}

export class ParseError implements Error {
    constructor(
        public readonly token: Token,
        public readonly message: string,
        public readonly name: string = "Parse error",
    ) { }
    public toString(): string {
        return `${this.name}: ${this.message} @ ${this.token.line}`
    }
}

export class Return extends Error {
    readonly value: Object | null;
    constructor(value: Object | null) {
        super();
        this.value = value;
    }
}

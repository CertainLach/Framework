export default class TimingData {
    data: any[];
    cn: string;
    st: number;
    constructor();
    start(name: string): void;
    stop(): void;
    readonly buffer: any[];
}

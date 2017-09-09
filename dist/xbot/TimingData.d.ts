export default class TimingData {
    data: any[];
    cn: string;
    st: number;
    /**
     * Used to save timings between bot events
     */
    constructor();
    /**
     * New timing
     */
    start(name: string): void;
    /**
     * Stop timing and write to buffer
     */
    stop(): void;
    readonly buffer: any[];
}

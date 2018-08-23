export default class TimingData {
    private data;
    private cn;
    private st;
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
    readonly buffer: [string, number, number, number][];
}

export default class TimeoutError extends Error {
    constructor() {
        super('component loading timeout')
    }
}

enum ErrorType {
    /**
     * No error
     */
    NONE,
    /**
     * Module failed to load in time
     */
    TIMEOUT_ERROR,
    /**
     * Module failed to load (import() call thrown error)
     */
    LOADING_ERROR
}
export default ErrorType;
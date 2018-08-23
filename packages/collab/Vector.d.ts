export default class Vector {
    static user_regex: RegExp;
    static timestring_regex: RegExp;
    toHTML(): string;
    users: {
        [key: number]: number;
    };
    /**
     * Stores state vectors
     * @param value Pre-initialize the vector with existing values. This can be
     * a Vector object, a generic Object with numeric properties, or a string of
     * the form "1:2;3:4;5:6".
     */
    constructor(value: Vector | string);
    /**
     * Helper function to easily iterate over all users in this vector
     * @param callback Callback function which is called with the user
     * and the value of each component. If this callback function returns false,
     * iteration is stopped at that point and false is returned
     */
    eachUser(callback: (u: number, v: number) => boolean): boolean;
    /**
     * Returns this vector as a string of the form "1:2;3:4;5:6"
     */
    toString(): string;
    /**
     * Returns the sum of two vectors
     * @param other
     */
    add(other: Vector): Vector;
    /**
     * Returns a copy of this vector
     */
    copy(): Vector;
    /**
     * Returns a specific component of this vector, or 0 if it is not defined
     * @param user Index of the component to be returned
     */
    get(user: number): number;
    /**
     * Calculates whether this vector is smaller than or equal to another vector.
     * This means that all components of this vector are less than or equal to
     * their corresponding components in the other vector
     * @param other The vector to compare to
     */
    causallyBefore(other: Vector): boolean;
    /**
     * Determines whether this vector is equal to another vector. This is true if
     * all components of this vector are present in the other vector and match
     * their values, and vice-versa
     * @param other The vector to compare to
     */
    equals(other: Vector): boolean;
    /**
     * Returns a new vector with a specific component increased by a given
     * amount
     * @param user Component to increase
     * @param by Amount by which to increase the component
     */
    incr(user: number, by?: number): Vector;
    /**
     * Calculates the least common successor of two vectors
     * @param v1
     * @param v2
     */
    static leastCommonSuccessor(v1: Vector, v2: Vector): Vector;
}

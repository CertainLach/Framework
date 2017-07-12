/**
 * @class Stores state vectors.
 * @param [value] Pre-initialize the vector with existing values. This can be
 * a Vector object, a generic Object with numeric properties, or a string of
 * the form "1:2;3:4;5:6".
 */
export default class Vector {
    static user_regex = /\d+/;
    static timestring_regex = /(\d+):(\d+)/g;

    toHTML() {
        return this.toString();
    }

    constructor(value: Vector | string | any) {
        if (typeof(value) == "object") {
            for (const user in value) {
                if (user.match(Vector.user_regex) && value[user] > 0)
                    this[user] = value[user];
            }
        } else if (typeof(value) == "string") {
            let match = Vector.timestring_regex.exec(value);
            while (match != null) {
                this[match[1]] = parseInt(match[2]);
                match = Vector.timestring_regex.exec(value);
            }
        }
    }

    /** Helper function to easily iterate over all users in this vector.
     *  @param {function} callback Callback function which is called with the user
     *  and the value of each component. If this callback function returns false,
     *  iteration is stopped at that point and false is returned.
     *  @type Boolean
     *  @returns True if the callback function has never returned false; returns
     *  False otherwise.
     */
    eachUser(callback) {
        for (const user in this) {
            if (user.match(Vector.user_regex)) {
                if (callback(parseInt(user), this[user]) == false)
                    return false;
            }
        }

        return true;
    }

    /** Returns this vector as a string of the form "1:2;3:4;5:6"
     *  @type String
     */
    toString() {
        const components = new Array();

        this.eachUser((u, v) => {
            if (v > 0)
                components.push(`${u}:${v}`);
        });

        components.sort();

        return components.join(";");
    }

    /** Returns the sum of two vectors.
     *  @param {Vector} other
     */
    add(other) {
        const result = new Vector(this);

        other.eachUser((u, v) => {
            result[u] = result.get(u) + v;
        });

        return result;
    }

    /** Returns a copy of this vector. */
    copy() {
        return new Vector(this);
    }

    /** Returns a specific component of this vector, or 0 if it is not defined.
     *  @param {number} user Index of the component to be returned
     */
    get(user) {
        if (this[user] != undefined)
            return this[user];
        else
            return 0;
    }

    /** Calculates whether this vector is smaller than or equal to another vector.
     *  This means that all components of this vector are less than or equal to
     *  their corresponding components in the other vector.
     *  @param {Vector} other The vector to compare to
     *  @type Boolean
     */
    causallyBefore(other) {
        return this.eachUser((u, v) => v <= other.get(u));
    }

    /** Determines whether this vector is equal to another vector. This is true if
     *  all components of this vector are present in the other vector and match
     *  their values, and vice-versa.
     *  @param {Vector} other The vector to compare to
     *  @type Boolean
     */
    equals(other) {
        const eq1 = this.eachUser((u, v) => other.get(u) == v);

        const self = this;
        const eq2 = other.eachUser((u, v) => self.get(u) == v);

        return eq1 && eq2;
    }

    /** Returns a new vector with a specific component increased by a given
     *  amount.
     *  @param {number} user Component to increase
     *  @param {number} [by] Amount by which to increase the component (default 1)
     *  @type Vector
     */
    incr(user, by: number = 1) {
        const result = new Vector(this);

        result[user] = result.get(user) + by;

        return result;
    }

    /** Calculates the least common successor of two vectors.
     *  @param {Vector} v1
     *  @param {Vector} v2
     *  @type Vector
     */
    static leastCommonSuccessor(v1, v2) {
        const result = v1.copy();

        v2.eachUser((u, v) => {
            const val1 = v1.get(u);
            const val2 = v2.get(u);

            if (val1 < val2)
                result[u] = val2;
            //else
            //	result[u] = val1; // This is already the case since we copied v1
        });

        return result;
    }
}
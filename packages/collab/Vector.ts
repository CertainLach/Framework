type VectorMetatype = {[key: number]: string};

export default class Vector {
    static user_regex = /\d+/;
    static timestring_regex = /(\d+):(\d+)/g;

    toHTML() {
        return this.toString();
    }

    users: {[key: string]: number} = {};

    /**
     * Stores state vectors
     * @param value Pre-initialize the vector with existing values. This can be
     * a Vector object, a generic Object with numeric properties, or a string of
     * the form "1:2;3:4;5:6".
     */
    constructor(value: Vector | string) {
        if (value instanceof Vector) {
            for (const user in value.users) {
                if (user.match(Vector.user_regex) && value.users[user] > 0)
                    this.users[user] = value.users[user];
            }
        } else if (typeof(value) == "string") {
            let match = Vector.timestring_regex.exec(value);
            while (match != null) {
                this.users[match[1]] = parseInt(match[2], 10);
                match = Vector.timestring_regex.exec(value);
            }
        }
    }

    /**
     * Helper function to easily iterate over all users in this vector
     * @param callback Callback function which is called with the user
     * and the value of each component. If this callback function returns false,
     * iteration is stopped at that point and false is returned
     */
    eachUser(callback: (u:number,v:number)=>boolean):boolean {
        for (const user in this.users) {
            if (user.match(Vector.user_regex)) {
                if (callback(parseInt(user), this.users[user]) === false)
                    return false;
            }
        }

        return true;
    }

    /**
     * Returns this vector as a string of the form "1:2;3:4;5:6"
     */
    toString():string {
        const components = new Array<string>();

        this.eachUser((u, v) => {
            if (v > 0)
                components.push(`${u}:${v}`);
            return true;
        });

        components.sort();

        return components.join(";");
    }

    /**
     * Returns the sum of two vectors
     * @param other
     */
    add(other: Vector) {
        const result = new Vector(this);

        other.eachUser((u, v) => {
            result.users[u] = result.get(u) + v;
            return true;
        });

        return result;
    }

    /**
     * Returns a copy of this vector
     */
    copy(): Vector {
        return new Vector(this);
    }

    /**
     * Returns a specific component of this vector, or 0 if it is not defined
     * @param user Index of the component to be returned
     */
    get(user:number):number {
        if (this.users[user] !== undefined)
            return this.users[user];
        else
            return 0;
    }

    /**
     * Calculates whether this vector is smaller than or equal to another vector.
     * This means that all components of this vector are less than or equal to
     * their corresponding components in the other vector
     * @param other The vector to compare to
     */
    causallyBefore(other: Vector):boolean {
        return this.eachUser((u, v) => v <= other.get(u));
    }


    /**
     * Determines whether this vector is equal to another vector. This is true if
     * all components of this vector are present in the other vector and match
     * their values, and vice-versa
     * @param other The vector to compare to
     */
    equals(other:Vector):boolean {
        const eq1 = this.eachUser((u, v) => other.get(u) == v);

        const self = this;
        const eq2 = other.eachUser((u, v) => self.get(u) == v);

        return eq1 && eq2;
    }


    /**
     * Returns a new vector with a specific component increased by a given
     * amount
     * @param user Component to increase
     * @param by Amount by which to increase the component
     */
    incr(user, by: number = 1):Vector {
        // console.log('incr',this);
        const result = new Vector(this);
        result.users[user] = result.get(user) + by;
        return result;
    }

    /**
     * Calculates the least common successor of two vectors
     * @param v1 
     * @param v2 
     */
    static leastCommonSuccessor(v1: Vector, v2:Vector): Vector {
        const result = v1.copy();

        v2.eachUser((u, v) => {
            const val1 = v1.get(u);
            const val2 = v2.get(u);

            if (val1 < val2)
                result.users[u] = val2;
            return true;
            //else
            //	result[u] = val1; // This is already the case since we copied v1
        });

        return result;
    }
}
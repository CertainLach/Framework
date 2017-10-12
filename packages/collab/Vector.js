var Vector = /** @class */ (function () {
    /**
     * Stores state vectors
     * @param value Pre-initialize the vector with existing values. This can be
     * a Vector object, a generic Object with numeric properties, or a string of
     * the form "1:2;3:4;5:6".
     */
    function Vector(value) {
        this.users = {};
        if (value instanceof Vector) {
            for (var user in value) {
                if (user.match(Vector.user_regex) && value[user] > 0)
                    this.users[user] = value.users[user];
            }
        }
        else if (typeof (value) == "string") {
            var match = Vector.timestring_regex.exec(value);
            while (match != null) {
                this.users[match[1]] = parseInt(match[2], 10);
                match = Vector.timestring_regex.exec(value);
            }
        }
    }
    Vector.prototype.toHTML = function () {
        return this.toString();
    };
    /**
     * Helper function to easily iterate over all users in this vector
     * @param callback Callback function which is called with the user
     * and the value of each component. If this callback function returns false,
     * iteration is stopped at that point and false is returned
     */
    Vector.prototype.eachUser = function (callback) {
        for (var user in this.users) {
            if (user.match(Vector.user_regex)) {
                if (callback(parseInt(user), this[user]) === false)
                    return false;
            }
        }
        return true;
    };
    /**
     * Returns this vector as a string of the form "1:2;3:4;5:6"
     */
    Vector.prototype.toString = function () {
        var components = new Array();
        this.eachUser(function (u, v) {
            if (v > 0)
                components.push(u + ":" + v);
            return true;
        });
        components.sort();
        return components.join(";");
    };
    /**
     * Returns the sum of two vectors
     * @param other
     */
    Vector.prototype.add = function (other) {
        var result = new Vector(this);
        other.eachUser(function (u, v) {
            result[u] = result.get(u) + v;
            return true;
        });
        return result;
    };
    /**
     * Returns a copy of this vector
     */
    Vector.prototype.copy = function () {
        return new Vector(this);
    };
    /**
     * Returns a specific component of this vector, or 0 if it is not defined
     * @param user Index of the component to be returned
     */
    Vector.prototype.get = function (user) {
        if (this.users[user] !== undefined)
            return this.users[user];
        else
            return 0;
    };
    /**
     * Calculates whether this vector is smaller than or equal to another vector.
     * This means that all components of this vector are less than or equal to
     * their corresponding components in the other vector
     * @param other The vector to compare to
     */
    Vector.prototype.causallyBefore = function (other) {
        return this.eachUser(function (u, v) { return v <= other.get(u); });
    };
    /**
     * Determines whether this vector is equal to another vector. This is true if
     * all components of this vector are present in the other vector and match
     * their values, and vice-versa
     * @param other The vector to compare to
     */
    Vector.prototype.equals = function (other) {
        var eq1 = this.eachUser(function (u, v) { return other.get(u) == v; });
        var self = this;
        var eq2 = other.eachUser(function (u, v) { return self.get(u) == v; });
        return eq1 && eq2;
    };
    /**
     * Returns a new vector with a specific component increased by a given
     * amount
     * @param user Component to increase
     * @param by Amount by which to increase the component
     */
    Vector.prototype.incr = function (user, by) {
        if (by === void 0) { by = 1; }
        var result = new Vector(this);
        result[user] = result.get(user) + by;
        return result;
    };
    /**
     * Calculates the least common successor of two vectors
     * @param v1
     * @param v2
     */
    Vector.leastCommonSuccessor = function (v1, v2) {
        var result = v1.copy();
        v2.eachUser(function (u, v) {
            var val1 = v1.get(u);
            var val2 = v2.get(u);
            if (val1 < val2)
                result[u] = val2;
            return true;
            //else
            //	result[u] = val1; // This is already the case since we copied v1
        });
        return result;
    };
    Vector.user_regex = /\d+/;
    Vector.timestring_regex = /(\d+):(\d+)/g;
    return Vector;
}());
export default Vector;
//# sourceMappingURL=Vector.js.map
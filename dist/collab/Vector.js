"use strict";
class Vector {
    constructor(value) {
        this.users = {};
        if (value instanceof Vector) {
            for (const user in value) {
                if (user.match(Vector.user_regex) && value[user] > 0)
                    this.users[user] = value.users[user];
            }
        }
        else if (typeof (value) == "string") {
            let match = Vector.timestring_regex.exec(value);
            while (match != null) {
                this.users[match[1]] = parseInt(match[2], 10);
                match = Vector.timestring_regex.exec(value);
            }
        }
    }
    toHTML() {
        return this.toString();
    }
    eachUser(callback) {
        for (const user in this.users) {
            if (user.match(Vector.user_regex)) {
                if (callback(parseInt(user), this[user]) === false)
                    return false;
            }
        }
        return true;
    }
    toString() {
        const components = new Array();
        this.eachUser((u, v) => {
            if (v > 0)
                components.push(`${u}:${v}`);
            return true;
        });
        components.sort();
        return components.join(";");
    }
    add(other) {
        const result = new Vector(this);
        other.eachUser((u, v) => {
            result[u] = result.get(u) + v;
            return true;
        });
        return result;
    }
    copy() {
        return new Vector(this);
    }
    get(user) {
        if (this.users[user] !== undefined)
            return this.users[user];
        else
            return 0;
    }
    causallyBefore(other) {
        return this.eachUser((u, v) => v <= other.get(u));
    }
    equals(other) {
        const eq1 = this.eachUser((u, v) => other.get(u) == v);
        const self = this;
        const eq2 = other.eachUser((u, v) => self.get(u) == v);
        return eq1 && eq2;
    }
    incr(user, by = 1) {
        const result = new Vector(this);
        result[user] = result.get(user) + by;
        return result;
    }
    static leastCommonSuccessor(v1, v2) {
        const result = v1.copy();
        v2.eachUser((u, v) => {
            const val1 = v1.get(u);
            const val2 = v2.get(u);
            if (val1 < val2)
                result[u] = val2;
            return true;
        });
        return result;
    }
}
Vector.user_regex = /\d+/;
Vector.timestring_regex = /(\d+):(\d+)/g;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Vector;
//# sourceMappingURL=Vector.js.map
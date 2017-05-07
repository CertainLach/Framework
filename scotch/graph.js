function createDFS(edges, leavesOnly, result) {
    const currentPath = [];
    const visited = {};
    return function deepFirstSearch(currentNode) {
        visited[currentNode] = true;
        currentPath.push(currentNode);
        edges[currentNode].forEach(node => {
            if (!visited[node]) {
                deepFirstSearch(node);
            } else if (currentPath.includes(node)) {
                currentPath.push(node);
                throw new Error(`Dependency Cycle Found: ${currentPath.join(' -> ')}`);
            }
        });
        currentPath.pop();
        if ((!leavesOnly || edges[currentNode].length === 0) && !result.includes(currentNode)) {
            result.push(currentNode);
        }
    };
}

export default class DepGraph {
    constructor() {
        this.nodes = {};
        this.outgoingEdges = {}; 
        this.incomingEdges = {}; 
    }

    addNode(node, data) {
        if (!this.hasNode(node)) {
            if (arguments.length === 2) {
                this.nodes[node] = data;
            } else {
                this.nodes[node] = node;
            }
            this.outgoingEdges[node] = [];
            this.incomingEdges[node] = [];
        }
    }

    removeNode(node) {
        if (this.hasNode(node)) {
            delete this.nodes[node];
            delete this.outgoingEdges[node];
            delete this.incomingEdges[node];
            [this.incomingEdges, this.outgoingEdges].forEach(function(edgeList) {
                Object.keys(edgeList).forEach(key => {
                    const idx = edgeList[key].indexOf(node);
                    if (idx >= 0) {
                        edgeList[key].splice(idx, 1);
                    }
                }, this);
            });
        }
    }

    hasNode(node) {
        return this.nodes.hasOwnProperty(node);
    }

    getNodeData(node) {
        if (this.hasNode(node)) {
            return this.nodes[node];
        } else {
            throw new Error(`Node does not exist: ${node}`);
        }
    }

    setNodeData(node, data) {
        if (this.hasNode(node)) {
            this.nodes[node] = data;
        } else {
            throw new Error(`Node does not exist: ${node}`);
        }
    }

    addDependency(from, to) {
        if (!this.hasNode(from)) {
            throw new Error(`Node does not exist: ${from}`);
        }
        if (!this.hasNode(to)) {
            throw new Error(`Node does not exist: ${to}`);
        }
        if (!this.outgoingEdges[from].includes(to)) {
            this.outgoingEdges[from].push(to);
        }
        if (!this.incomingEdges[to].includes(from)) {
            this.incomingEdges[to].push(from);
        }
        return true;
    }

    removeDependency(from, to) {
        let idx;
        if (this.hasNode(from)) {
            idx = this.outgoingEdges[from].indexOf(to);
            if (idx >= 0) {
                this.outgoingEdges[from].splice(idx, 1);
            }
        }

        if (this.hasNode(to)) {
            idx = this.incomingEdges[to].indexOf(from);
            if (idx >= 0) {
                this.incomingEdges[to].splice(idx, 1);
            }
        }
    }

    dependenciesOf(node, leavesOnly) {
        if (this.hasNode(node)) {
            const result = [];
            const DFS = createDFS(this.outgoingEdges, leavesOnly, result);
            DFS(node);
            const idx = result.indexOf(node);
            if (idx >= 0) {
                result.splice(idx, 1);
            }
            return result;
        } else {
            throw new Error(`Node does not exist: ${node}`);
        }
    }

    dependantsOf(node, leavesOnly) {
        if (this.hasNode(node)) {
            const result = [];
            const DFS = createDFS(this.incomingEdges, leavesOnly, result);
            DFS(node);
            const idx = result.indexOf(node);
            if (idx >= 0) {
                result.splice(idx, 1);
            }
            return result;
        } else {
            throw new Error(`Node does not exist: ${node}`);
        }
    }

    overallOrder(leavesOnly) {
        const self = this;
        const result = [];
        const keys = Object.keys(this.nodes);
        if (keys.length === 0) {
            return result; 
        } else {
            const CycleDFS = createDFS(this.outgoingEdges, false, []);
            keys.forEach(n => {
                CycleDFS(n);
            });

            const DFS = createDFS(this.outgoingEdges, leavesOnly, result);
            keys.filter(node => self.incomingEdges[node].length === 0).forEach(n => {
                DFS(n);
            });

            return result;
        }
    }
}

const PLUGIN_REQUIRED_FIELDS = ['name', 'author', 'description', 'dependencies'];

export function isAllDepsResolved(plugin) {
    // console.log(plugin.resolved);
    if (!plugin) return false;
    if (!plugin.resolved) return false;
    if (plugin.dependencies.length === 0) return true;
    if (plugin.dependencies.length === Object.keys(plugin.resolved).length) return true;
    return false;
}

export function validatePlugin(plugin,isHard) {
    for (let field of PLUGIN_REQUIRED_FIELDS) {
        if (!plugin.constructor[field]) {
            if (field === 'name') {
                throw new Error('No name is defined for plugin in "' + plugin.file + '"!\nIf this plugin is defined in ES6 style, please write class name');
            }
            else {
                if(field==='dependencies'&&!isHard)
                    continue; // Since soft plugins doesn't supports it
                console.log(plugin.constructor);
                throw new Error('No ' + field + ' is defined for "' + plugin.name + '" in "' + plugin.file + '"!');
            }
        }
    }
}

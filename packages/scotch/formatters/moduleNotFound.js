import {relative} from 'path';
function concat() {
  const args = Array.from(arguments).filter(e => e != null);
  const baseArray = Array.isArray(args[0]) ? args[0] : [args[0]];
  return Array.prototype.concat.apply(baseArray, args.slice(1));
}
function isRelative (module) {
  return module.startsWith('./') || module.startsWith('../');
}

function formatFileList (files) {
  files=files.map(file=>file.yellow);
  const length = files.length;
  if (!length) return '';
  return ` in ${files[0]}${files[1] ? `, ${files[1]}` : ''}${length > 2 ? ` and ${length - 2} other${length === 3 ? '' : 's'}` : ''}`;
}

function formatGroup (group) {
  const files = group.errors.map(e => e.file).filter(Boolean);
  return `- ${group.module.green}${formatFileList(files)}`;
}
function realName(module){
  let parts=module.split('/');
  if(parts[0][0]==='@'){
    return parts.slice(0,2).join('/');
  }else{
    return parts[0];
  }
}

function forgetToInstall (missingDependencies) {
  const moduleNames = Array.from(new Set(missingDependencies.map(missingDependency => missingDependency.module)
  .map(realName)));

  if (missingDependencies.length === 1) {
    return `To install it, you can run: ${`npm install --save ${moduleNames.map(e=>e.underline).join(' ').bold}`.yellow}`;
  }

  return `To install them, you can run: ${`npm install --save ${moduleNames.map(e=>e.underline).join(' ').bold}`.yellow}`;
}

function dependenciesNotFound (dependencies) {
  if (dependencies.length === 0) return;

  return concat(
    dependencies.length === 1 ? 'This dependency was not found:' : 'These dependencies were not found:',
    '',
    dependencies.map(formatGroup),
    '',
    forgetToInstall(dependencies)
  );
}

function relativeModulesNotFound (modules) {
  if (modules.length === 0) return;

  return concat(
    modules.length === 1 ? 'This relative module was not found:' : 'These relative modules were not found:',
    '',
    modules.map(formatGroup)
  );
}

function groupModules (errors) {
  const missingModule = new Map();

  errors.forEach((error) => {
    if (!missingModule.has(error.module)) {
      missingModule.set(error.module, [])
    }
    missingModule.get(error.module).push(error);
  });

  return Array.from(missingModule.keys()).map(module => ({
    module: module,
    relative: isRelative(module),
    errors: missingModule.get(module),
  }));
}

function formatErrors (errors) {
  if (errors.length === 0) {
    return [];
  }

  const groups = groupModules(errors);

  const dependencies = groups.filter(group => !group.relative);
  const relativeModules = groups.filter(group => group.relative);

  return concat(
    dependenciesNotFound(dependencies),
    dependencies.length && relativeModules.length ? ['', ''] : null,
    relativeModulesNotFound(relativeModules)
  );
}

export default function format (errors) {
  return formatErrors(errors.filter((e) => (
    e.type === 'module-not-found'
  )));
}


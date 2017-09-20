import PrettyError from 'pretty-error';
const pe = new PrettyError();

function concat() {
  const args = Array.from(arguments).filter(e => e != null);
  const baseArray = Array.isArray(args[0]) ? args[0] : [args[0]];
  return Array.prototype.concat.apply(baseArray, args.slice(1));
}

function displayError(severity, error) {
  return concat(
    `${severity.toUpperCase().red} ${removeLoaders(error.file)}`,
    '',
    pe.render(error.webpackError).replace('Module build failed: Error: [BABEL] ','')
  );
}

function removeLoaders(file) {
  if (!file) {
    return "";
  }
  const split = file.split('!');
  const filePath = split[split.length - 1];
  return `in ${filePath.green}`;
}

function isDefaultError(error) {
  return !error.type;
}

/**
 * Format errors without a type
 */
export default function format(errors, type) {
  return errors
    .filter(isDefaultError)
    .reduce((accum, error) => (
      accum.concat(displayError(type, error))
    ), []);
}

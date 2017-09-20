function concat() {
  const args = Array.from(arguments).filter(e => e != null);
  const baseArray = Array.isArray(args[0]) ? args[0] : [args[0]];
  return Array.prototype.concat.apply(baseArray, args.slice(1));
}
const infos = [
  'You may use special comments to disable some warnings.',
  'Use ' + '// eslint-disable-next-line'.yellow + ' to ignore the next line.',
  'Use ' + '/* eslint-disable */'.yellow + ' to ignore all warnings in a file.'
];

function displayError(error) {
  return [error.message, '']
}

export default function format(errors, type) {
  const lintErrors = errors.filter(e => e.type === 'lint-error');
  if (lintErrors.length > 0) {
    const flatten = (accum, curr) => accum.concat(curr);
    return concat(
      lintErrors
        .map(error => displayError(error))
        .reduce(flatten, []),
      infos
    )
  }

  return [];
}

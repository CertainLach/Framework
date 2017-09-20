export default function formatErrors(errors, formatters, errorType) {
  const format = (formatter) => formatter(errors, errorType) || [];
  const flatten = (accum, curr) => accum.concat(curr);
  return formatters.map(format).reduce(flatten, [])
}

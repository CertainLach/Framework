import extractWebpackError from './extractWebpackError';

export default function processErrors (errors, transformers) {
  const transform = (error, transformer) => transformer(error);
  const applyTransformations = (error) => transformers.reduce(transform, error);

  return errors.map(extractWebpackError).map(applyTransformations);
}

import ErrorStackParser from 'error-stack-parser';
import RequestShortener from 'webpack/lib/RequestShortener';

export default function extractError (e) {
  return {
    message: e.message,
    file: getFile(e),
    origin: getOrigin(e),
    name: e.name,
    severity: 0,
    webpackError: e,
    originalStack: getOriginalErrorStack(e)
  };
}

function getOriginalErrorStack(e) {
  while (e.error != null) {
    e = e.error;
  }
  if (e.stack) {
    return ErrorStackParser.parse(e);
  }
  return [];
}

function getFile (e) {
  if (e.file) {
    return e.file;
  } else if (e.module && e.module.readableIdentifier && typeof e.module.readableIdentifier === "function") {
    return e.module.readableIdentifier(new RequestShortener(global.projectDir));
  }
}

function getOrigin (e) {
  let origin = '';
  if (e.dependencies && e.origin) {
    origin += '\n @ ' + e.origin.readableIdentifier(new RequestShortener(global.projectDir));
    e.dependencies.forEach(function (dep) {
      if (!dep.loc) return;
      if (typeof dep.loc === "string") return;
      if (!dep.loc.start) return;
      if (!dep.loc.end) return;
      origin += ' ' + dep.loc.start.line + ':' + dep.loc.start.column + '-' +
        (dep.loc.start.line !== dep.loc.end.line ? dep.loc.end.line + ':' : '') + dep.loc.end.column;
    });
    var current = e.origin;
    while (current.issuer && typeof current.issuer.readableIdentifier === 'function') {
      current = current.issuer;
      origin += '\n @ ' + current.readableIdentifier(new RequestShortener(global.projectDir));
    }
  }
  return origin;
}

import path from 'node:path';

const stripPrefix = (workspace, files) =>
  files
    .map((f) => path.relative(workspace, f))
    .map((f) => JSON.stringify(f))
    .join(' ');

export default {
  'backend/**/*.ts': (files) => {
    const rel = stripPrefix('backend', files);
    return [
      `npm exec --workspace=backend -- eslint --fix ${rel}`,
      `prettier --write ${files.map((f) => JSON.stringify(f)).join(' ')}`,
    ];
  },
  'frontend/**/*.{ts,tsx,js,jsx}': (files) => {
    const rel = stripPrefix('frontend', files);
    return [
      `npm exec --workspace=frontend -- eslint --fix ${rel}`,
      `prettier --write ${files.map((f) => JSON.stringify(f)).join(' ')}`,
    ];
  },
  '*.{json,md,yml,yaml}': (files) =>
    `prettier --write ${files.map((f) => JSON.stringify(f)).join(' ')}`,
};

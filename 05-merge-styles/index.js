const fs = require('fs');
const path = require('path');

const { pipeline, flow, ls, cat, filter, map } = require('../lib/streamutils');

async function main() {
  const sourceFolder = path.join(__dirname, 'styles');
  const targetFile = path.join(__dirname, 'project-dist', 'bundle.css');

  const transform = flow(
    ls({ recursive: true }),
    filter(({ dirent }) => dirent.isFile()),
    filter(({ filename }) => path.extname(filename) === '.css'),
    map((f) => f.filename),
    cat
  );

  const bundle = transform(sourceFolder);
  const out = fs.createWriteStream(targetFile);

  await pipeline(bundle, out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

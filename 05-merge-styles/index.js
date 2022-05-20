const fs = require('fs');
const path = require('path');

const {
  pipeline,
  flow,
  ls,
  append,
  flatMap,
  filter,
  map,
  id,
} = require('../lib/streamutils');

async function bundleCss(sourceFolder, targetFile) {
  const transform = flow(
    ls({ recursive: true }),
    filter(({ dirent }) => dirent.isFile()),
    filter(({ filename }) => path.extname(filename) === '.css'),
    map((f) => f.filename),
    map(fs.createReadStream),
    map(append(require('os').EOL)),
    flatMap(id)
  );

  const bundle = transform(sourceFolder);
  const out = fs.createWriteStream(targetFile);

  return pipeline(bundle, out);
}

async function main() {
  const sourceFolder = path.join(__dirname, 'styles');
  const targetFile = path.join(__dirname, 'project-dist', 'bundle.css');
  await bundleCss(sourceFolder, targetFile);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

exports.bundleCss = bundleCss;

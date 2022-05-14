const { EOL } = require('os');
const fs = require('fs');
const path = require('path');

const { bundleCss } = require('../05-merge-styles');
const { syncFolders } = require('../04-copy-directory');
const { pipeline, cat, lines } = require('../lib/streamutils');

const tagRe = /\{\{\s*(\w+)\s*\}\}/g;

async function* processTags(filename, includesDir) {
  const template = fs.createReadStream(filename);
  for await (const line of lines(template)) {
    const segments = line.split(tagRe);
    while (segments.length) {
      yield segments.shift();
      // every second element of segments array is component name (regex group)
      if (segments[0]) {
        const componentName = segments.shift();
        const filename = path.join(includesDir, componentName) + '.html';
        yield* cat([filename]);
      }
    }
    yield EOL;
  }
}

async function build() {
  const outputDir = path.join(__dirname, 'project-dist');
  const includesDir = path.join(__dirname, 'components');

  await fs.promises.rm(outputDir, { recursive: true, force: true });
  await fs.promises.mkdir(outputDir, { recursive: true });

  const htmlPipeline = pipeline(
    processTags(path.join(__dirname, 'template.html'), includesDir),
    fs.createWriteStream(path.join(outputDir, 'index.html'))
  );

  const cssPipeline = bundleCss(
    path.join(__dirname, 'styles'),
    path.join(outputDir, 'style.css')
  );

  const assetsPipeline = syncFolders(
    path.join(__dirname, 'assets'),
    path.join(outputDir, 'assets')
  );

  await Promise.all([htmlPipeline, cssPipeline, assetsPipeline]);
}

if (require.main === module) {
  build().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

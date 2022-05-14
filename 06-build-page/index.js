const fs = require('fs');
const path = require('path');

const { bundleCss } = require('../05-merge-styles');
const { pipeline, cat, lines, tap } = require('../lib/streamutils');

const tagRe = /\{\{\s*(\w+)\s*\}\}/g;

async function* processTags(filename, includesDir) {
  const template = fs.createReadStream(filename);
  for await (const line of lines(template)) {
    const segments = line.split(tagRe);
    while (segments.length) {
      yield segments.shift();
      // every second element of segments array is component name
      if (segments[0]) {
        const componentName = segments.shift();
        const filename = path.join(includesDir, componentName) + '.html';
        yield* cat([filename]);
      }
    }
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

  await Promise.all([htmlPipeline, cssPipeline]);
}

if (require.main === module) {
  build().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

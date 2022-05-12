const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FILENAME = 'output.txt';
const FULL_PATH = path.join(__dirname, FILENAME);
const LINE_WIDTH = 80;

const rl = readline.createInterface(process.stdin, process.stdout);
const output = fs.createWriteStream(FULL_PATH);

function exit() {
  output.end();
  rl.close();
}

function goodbye() {
  rl.output.write(`\n╶───┴${'─'.repeat(LINE_WIDTH - 6)}╴\n`);
  rl.output.write(` Saved to ${FULL_PATH}\n`);
}

let lineno = 0;
function getPrompt() {
  lineno++;
  return String(lineno).padStart(3, ' ') + ' │ ';
}

function question() {
  rl.question(getPrompt(), (answer) => {
    if (answer === 'exit') {
      // remove "exit" text from the output
      readline.moveCursor(rl.output, 6, -1, () => {
        readline.clearLine(rl.output, 1, exit);
      });
      return;
    }
    output.write(answer + '\n', 'utf8');
    question();
  });
}

// handle both Ctrl+C and Ctrl+D
rl.on('close', goodbye);

rl.output.write(`┌${'─'.repeat(LINE_WIDTH - 2)}┐\n`);
rl.output.write(
  `│ ${'Type "exit" or press ctrl+c to save and exit.'.padEnd(
    LINE_WIDTH - 4,
    ' '
  )} │\n`
);
rl.output.write(`└───┬${'─'.repeat(LINE_WIDTH - 6)}┘\n`);
question();

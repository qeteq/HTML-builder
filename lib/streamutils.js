const fs = require('fs');
const path = require('path');
const stream = require('stream');
const readline = require('readline');
const pipeline = require('util').promisify(stream.pipeline);

const compose = (...fns) => (x) => fns.reduceRight((x, fn) => fn(x), x); // prettier-ignore
const flow = (...fns) => (x) => fns.reduce((x, fn) => fn(x), x); // prettier-ignore

const id = (x) => x;

/**
 * @template {T}
 * @param {(arg: T) => boolean} predicate
 * @returns {(iter: AsyncIterable<T>) => AsyncIterable<T>}
 */
const filter = (predicate) =>
  async function* (iter) {
    for await (const x of iter) {
      if (predicate(x)) {
        yield x;
      }
    }
  };

/**
 * @template {T, U}
 * @param {(arg: T) => U} predicate
 * @returns {(iter: AsyncIterable<T> | Iterable<T>) => AsyncIterable<U>}
 */
const map = (fn) =>
  async function* (iter) {
    for await (const x of iter) {
      yield fn(x);
    }
  };

/**
 * @template {T, U}
 * @param {(arg: T) => AsyncIterable<U> | Iterable<U>} predicate
 * @returns {(iter: AsyncIterable<T> | Iterable<T>) => AsyncIterable<U>}
 */
const flatMap = (fn) =>
  async function* (iter) {
    for await (const x of iter) {
      yield* fn(x);
    }
  };

/**
 * @param {object} options
 * @param {boolean} [options.recursive=false]
 * @returns {(folder: string) => AsyncIterable<{ filename: string, dirent: fs.Dirent }>}
 */
const ls = (options) =>
  async function* (folder) {
    const { recursive = false } = options;
    const dirs = [folder];
    while (dirs.length) {
      const dir = dirs.shift();
      const direntries = await fs.promises.readdir(dir, {
        withFileTypes: true,
      });
      for (const dirent of direntries) {
        const filename = path.join(dir, dirent.name);
        if (dirent.isFile()) {
          yield { filename, dirent };
        }
        if (recursive && dirent.isDirectory()) {
          dirs.push(filename);
        }
      }
    }
  };

/**
 * @param {AsyncIterable<string> | Iterable<string>} filesIterable filenames
 * @return {AsyncIterable<Buffer>} buffer stream of concatenated files content
 */
const cat = flatMap(fs.createReadStream);

/**
 * @param {string | buffer} content
 * @return {(iter: AsyncIterable<string | Buffer> | Iterable<string | Buffer>) => AsyncIterable<string | Buffer>} filesIterable filenames
 * @return {AsyncIterable<string | Buffer>} buffer stream of concatenated files content
 */
const append = (content) =>
  async function* (iter) {
    yield* iter;
    yield content;
  };

async function* lines(iter) {
  yield* readline.createInterface(stream.Readable.from(iter));
}

const tap = (callback) =>
  async function* (iter) {
    for await (const item of iter) {
      callback(item);
      yield item;
    }
  };

module.exports = {
  pipeline,
  compose,
  flow,
  id,
  ls,
  cat,
  append,
  filter,
  map,
  flatMap,
  lines,
  tap,
};

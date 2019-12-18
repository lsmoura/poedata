const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
const assert = chai.assert;
const should = chai.should();

const readDir = (dir) => new Promise((accept, reject) => {
  fs.readdir(dir, (err, files) => {
    if (err) return reject(err);
    accept(files);
  });
});

const readFile = (fn, encoding = 'utf-8') => new Promise((accept, reject) => {
  fs.readFile(fn, encoding, (err, data) => {
    if (err) return reject(err);
    accept(data);
  });
});

const readYaml = (fn) => readFile(fn).then(yaml.parse);

const isArraySorted = (a) => {
  if (!Array.isArray(a)) return false;

  for (let i = 1; i < a.length; i++) {
    if (a[i-1].localeCompare(a[i]) > 0) return i;
  }

  return true;
};

const testIsArraySorted = (a) => {
  const sortIdxError = isArraySorted(a);
  if (sortIdxError !== true) {
    const expectedOrder = a.concat().sort().join(',');
    throw new Error('object list is not sorted. expected: ' + expectedOrder + '. Error on entry ' + sortIdxError + '/' + a.length + ' (' + keys[sortIdxError] + ')');
  }
};

const testIsObjectKeysSorted = (obj) => testIsArraySorted(Object.keys(obj));

const testYaml = (fn) => readYaml(fn).then(data => {
  // keys should be sorted
  testIsObjectKeysSorted(data);

  Object.keys(data).map(entryKey => data[entryKey]).forEach(testIsObjectKeysSorted);

  return data;
});

const basedir = path.join(__dirname, '..');
const gemdir = path.join(basedir, 'gems');

const convertFn = (str) => {
  if (!str || typeof str !== 'string') return '';

  return str.replace(/['"]/g, '').replace(/ +/g, '-').toLowerCase();
}

describe('gem files are parseable', () => {
  let gemFiles = [];
  before(async () => {
    gemFiles = await readDir(gemdir);
  });

  it('parses files correctly', async () => {
    const files = gemFiles
      .filter(e => e[0] != '_')
      .map(e => path.join(gemdir, e));
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const data = await readYaml(file);
      assert.isNotEmpty(data, `file ${path.basename(file)} is empty`);
      assert.isNotEmpty(data.name, `file ${path.basename(file)} has no name`);
      assert.equal(path.basename(file, '.yaml'), convertFn(data.name), `file ${path.basename(file)} name should match gem name`);
    }
  });
});

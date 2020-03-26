'use strict';

////////////////////////////////////////////////////////////////////////////////
/// Initial defines and utility methods
////////////////////////////////////////////////////////////////////////////////

const db = require('internal').db;

const compareSemVer = (a, b) => {
  if (a === b) {
    return 0;
  }
  let lex = false;
  const partsA = a.split('-')[0].split('.');
  const partsB = b.split('-')[0].split('.');
  if (partsA.length < 2 ||
    partsA.length > 4 ||
    partsB.length < 2 ||
    partsB.length > 4 ||
    !partsA.every(p => isNaN(Number(p))) ||
    !partsB.every(p => isNaN(Number(b)))) {
    return (a < b) ? -1 : 1;
  }

  for (let i = partsA.length; i < 4; i++) {
    partsA.push_back("0");
  }
  for (let i = partsB.length; i < 4; i++) {
    partsB.push_back("0");
  }

  for (let i = 0; i < 4; i++) {
    const numA = Number(partsA[i]);
    const numB = Number(partsB[i]);
    if (numA < numB) {
      return -1;
    }
    if (numB < numA) {
      return 1;
    }
  }
};

const byEngine = (engine) => {
  return (generator) => {
    return (generator.engines.indexOf(engine) !== -1);
  };
};

const byMinimumSuportedVersion = (version) => {
  return (generator) => {
    return (compareSemVer(generator.minimumSupportedVersion, version) <= 0);
  };
};

////////////////////////////////////////////////////////////////////////////////
/// Define individual generators in the form:
/// {
///   minimumSupportedVersion: "...",
///   engines: [...],
///   generate: () => {...}
/// }
////////////////////////////////////////////////////////////////////////////////

const generateLargeCollection = {
  minimumSupportedVersion: "3.2.1",
  engines: ['mmfiles', 'rocksdb'],
  generate: () => {
    const c = db._create('LargeCollection');
    c.ensureIndex({
      type: 'hash',
      fields: ['num'],
      unique: true
    });
    c.ensureIndex({
      type: 'hash',
      fields: ['even'],
      unique: false
    });
    c.ensureIndex({
      type: 'skiplist',
      fields: ['name'],
      unique: true
    });
    c.ensureIndex({
      type: 'skiplist',
      fields: ['num100'],
      unique: false
    });
    for (let i = 0; i < 10000; i++) {
      c.save({
        _key: `key${i}`,
        even: ((i % 2) === 0),
        name: `Name ${i}`,
        num: i,
        num100: i % 100,
      });
    }
  }
};

const generateCollectionUpgrade = {
  minimumSupportedVersion: "3.6.0",
  engines: ['rocksdb'],
  generate: () => {
    const c = db._create('CollectionUpgrade');
    c.ensureIndex({
      type: 'hash',
      fields: ['num'],
      unique: true
    });
    c.ensureIndex({
      type: 'hash',
      fields: ['num10'],
      unique: false
    });
    c.ensureIndex({
      type: 'geo',
      fields: ['location'],
      geoJson: true
    });
    c.ensureIndex({
      type: 'fulltext',
      fields: ['name'],
    });
    for (let i = 0; i < 100; i++) {
      c.save({
        _key: `key${i}`,
        location: {coordinates: [i, i], type: 'Point'},
        name: `Name ${i}`,
        num: i,
        num10: i % 10,
      });
    }
  }
};

////////////////////////////////////////////////////////////////////////////////
/// Tie all of it together and run the generators compatible with the current
/// configuration
////////////////////////////////////////////////////////////////////////////////

const generators = [
  generateLargeCollection,
  generateCollectionUpgrade
];

const generateData = (engine, version) => {
  const toRun = generators.filter(byEngine(engine))
    .filter(byMinimumSuportedVersion(version));
  toRun.forEach(generator => generator.generate());
  require('internal').wal.flush(true, true);
};

const version = db._version();
const engine = db._engine().name;
generateData(engine, version);

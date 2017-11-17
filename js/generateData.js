'use strict';

const db = require('internal').db;

const generateLargeCollection = () => {
  const c = db._create('LargeCollection');
  c.ensureIndex( {
    type: 'hash',
    fields: [ 'num' ],
    unique: true
  } );
  c.ensureIndex( {
    type: 'hash',
    fields: [ 'even' ],
    unique: false
  } );
  c.ensureIndex( {
    type: 'skiplist',
    fields: [ 'name' ],
    unique: true
  } );
  c.ensureIndex( {
    type: 'skiplist',
    fields: [ 'num100' ],
    unique: false
  } );
  for (let i = 0; i < 10000; i++) {
    c.save( {
      _key: `key${i}`,
      even: ( ( i % 2 ) === 0 ),
      name: `Name ${i}`,
      num: i,
      num100: i % 100,
    } );
  }
};

const generateData = () => {
  generateLargeCollection();
  require('internal').wal.flush(true, true);
};

generateData();

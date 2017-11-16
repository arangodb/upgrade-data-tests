'use strict';

const db = require('internal').db;

const generateLargeCollection = () => {
  const c = db._create('LargeCollection');
  for (let i = 0; i < 10000; i++) {
    c.save( { i } );
  }
};

const generateData = () => {
  generateLargeCollection();
};

generateData();

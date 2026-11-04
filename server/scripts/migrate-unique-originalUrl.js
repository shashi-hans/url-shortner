// Replaces the plain originalUrl index with a unique one.
// Usage: NODE_ENV=production MONGO_URI=... node scripts/migrate-unique-originalUrl.js
// Stops without changes if duplicate originalUrl documents exist, and lists them for manual cleanup.
const mongoose = require('mongoose');
const config = require('config');
const Url = require('../models/Model-Url');

const run = async () => {
  await mongoose.connect(config.get('mongoURI'));

  const duplicates = await Url.aggregate([
    { $group: { _id: '$originalUrl', count: { $sum: 1 }, shortIds: { $push: '$shortId' } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  if (duplicates.length > 0) {
    console.error(`Found ${duplicates.length} originalUrl values with more than one document:`);
    for (const d of duplicates) console.error(`  ${d._id} -> ${d.shortIds.join(', ')}`);
    console.error('Delete the extra documents, then run this script again.');
    process.exitCode = 1;
    return;
  }

  const indexes = await Url.collection.indexes();
  const old = indexes.find((i) => i.name === 'originalUrl_1' && !i.unique);
  if (old) {
    await Url.collection.dropIndex('originalUrl_1');
    console.log('Dropped non-unique index originalUrl_1');
  }
  await Url.syncIndexes();
  console.log('Indexes are in sync:', (await Url.collection.indexes()).map((i) => i.name).join(', '));
};

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());

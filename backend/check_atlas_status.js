const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');

async function checkAtlas() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.log('STATUS: NO_URI_CONFIGURED');
    process.exit(1);
  }

  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');
  const isLocal = uri.includes('127.0.0.1') || uri.includes('localhost');

  if (!isAtlas) {
    console.log('STATUS: LOCAL_URI (Still pointing to local MongoDB)');
    process.exit(2);
  }

  // Attempt connection with 20 second timeout
  try {
    console.log('STATUS: INITIATING_CONNECTION');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
    });
    console.log('STATUS: MONGODB_CONNECTED');

    const dbName = conn.connection.name;
    const collections = await conn.connection.db.listCollections().toArray();
    const collectionSummary = [];

    for (const col of collections) {
      const count = await conn.connection.db.collection(col.name).countDocuments();
      collectionSummary.push({ name: col.name, count });
    }

    console.log('STATUS: CONNECTED_ATLAS');
    console.log(`DATABASE_NAME: ${dbName}`);
    console.log('COLLECTIONS_JSON:' + JSON.stringify(collectionSummary));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.log('STATUS: CONNECTION_FAILED');
    console.log('ERROR_REASON: ' + err.message);
    process.exit(3);
  }
}

checkAtlas();

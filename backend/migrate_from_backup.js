const fs = require('fs');
const path = require('path');
const { MongoClient, BSON } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const ATLAS_URI = process.env.MONGO_URI;

if (!ATLAS_URI || (!ATLAS_URI.startsWith('mongodb+srv://') && !ATLAS_URI.includes('mongodb.net'))) {
  console.error('ERROR: MONGO_URI in backend/.env is not an Atlas connection string');
  process.exit(1);
}

const BACKUP_DIR = path.resolve(__dirname, '../backup/local_helpdesk_db_backup/helpdesk_db');

function readBsonFile(filename) {
  const filePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file not found: ${filePath}`);
  }
  const buf = fs.readFileSync(filePath);
  const docs = [];
  let offset = 0;
  while (offset < buf.length) {
    const size = buf.readInt32LE(offset);
    const doc = BSON.deserialize(buf.subarray(offset, offset + size));
    docs.push(doc);
    offset += size;
  }
  return docs;
}

async function runMigration() {
  console.log('=== STARTING MIGRATION FROM LOCAL BACKUP TO ATLAS ===\n');
  console.log(`Backup Source Directory: ${BACKUP_DIR}`);

  const collectionsToMigrate = [
    { name: 'departments', file: 'departments.bson', expectedCount: 4 },
    { name: 'users', file: 'users.bson', expectedCount: 3 },
    { name: 'counters', file: 'counters.bson', expectedCount: 1 },
    { name: 'tickets', file: 'tickets.bson', expectedCount: 11 },
    { name: 'comments', file: 'comments.bson', expectedCount: 6 },
  ];

  // 1. Pre-flight check: read all backup files first
  const parsedData = {};
  for (const item of collectionsToMigrate) {
    const docs = readBsonFile(item.file);
    if (docs.length !== item.expectedCount) {
      throw new Error(`Integrity check failed: ${item.file} has ${docs.length} docs, expected ${item.expectedCount}`);
    }
    parsedData[item.name] = docs;
    console.log(`[Backup Verified] ${item.name}: ${docs.length} documents ready.`);
  }

  // 2. Connect to Atlas
  console.log('\nConnecting to MongoDB Atlas...');
  const client = new MongoClient(ATLAS_URI);
  await client.connect();
  const db = client.db('helpdesk_db');
  console.log('Connected to Atlas database: helpdesk_db');

  // Verify target is empty
  const existingCols = await db.listCollections().toArray();
  for (const col of existingCols) {
    const count = await db.collection(col.name).countDocuments();
    if (count > 0) {
      throw new Error(`Aborting: Atlas collection '${col.name}' is not empty (${count} documents).`);
    }
  }
  console.log('Target database verified empty (0 documents).\n');

  // 3. Insert each collection preserving exact BSON documents
  for (const item of collectionsToMigrate) {
    const docs = parsedData[item.name];
    console.log(`Migrating '${item.name}' (${docs.length} documents)...`);
    const insertResult = await db.collection(item.name).insertMany(docs, { ordered: true });
    console.log(`  -> Inserted: ${insertResult.insertedCount}`);

    const actualCount = await db.collection(item.name).countDocuments();
    if (actualCount !== item.expectedCount) {
      throw new Error(`Count mismatch in Atlas for ${item.name}: got ${actualCount}, expected ${item.expectedCount}`);
    }
    console.log(`  -> Verified in Atlas: ${actualCount}/${item.expectedCount} documents present.`);
  }

  // 4. Detailed verification of critical fields
  console.log('\n--- VERIFYING CRITICAL RECORD INTEGRITY ---');

  // Counter check
  const counterDoc = await db.collection('counters').findOne({ _id: 'ticketId' });
  console.log(`Counter State: _id = ${counterDoc._id}, seq = ${counterDoc.seq} (Expected: 1011)`);
  if (!counterDoc || counterDoc.seq !== 1011) {
    throw new Error(`Counter sequence mismatch: got ${counterDoc ? counterDoc.seq : 'null'}`);
  }

  // Ticket ID range check
  const tickets = await db.collection('tickets').find({}, { projection: { ticketId: 1, title: 1, status: 1 } }).sort({ ticketId: 1 }).toArray();
  console.log(`Tickets loaded: ${tickets.length}`);
  const ticketIds = tickets.map(t => t.ticketId);
  console.log(`Ticket ID range: ${ticketIds[0]} -> ${ticketIds[ticketIds.length - 1]}`);
  if (ticketIds[0] !== 'TKT-1001' || ticketIds[ticketIds.length - 1] !== 'TKT-1011') {
    throw new Error('Ticket sequence range mismatch!');
  }

  // User check
  const users = await db.collection('users').find({}, { projection: { email: 1, role: 1 } }).toArray();
  console.log(`Users loaded (${users.length}):`);
  users.forEach(u => console.log(`  - ${u.email} (${u.role})`));

  console.log('\n=== MIGRATION COMPLETE & VERIFIED 100% ===');
  await client.close();
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('\nFATAL ERROR DURING MIGRATION:', err.message);
  process.exit(1);
});

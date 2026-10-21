const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const uri = process.env.MONGO_URI;

async function verifyAtlas() {
  console.log('=== VERIFYING ATLAS HELPDESK_DB STATE ===\n');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('helpdesk_db');

  // 1. Counts
  const counts = {
    users: await db.collection('users').countDocuments(),
    departments: await db.collection('departments').countDocuments(),
    tickets: await db.collection('tickets').countDocuments(),
    comments: await db.collection('comments').countDocuments(),
    counters: await db.collection('counters').countDocuments(),
  };

  console.log('1. Collection Counts in Atlas:');
  console.log(`   - users: ${counts.users} (Expected: 3)`);
  console.log(`   - departments: ${counts.departments} (Expected: 4)`);
  console.log(`   - tickets: ${counts.tickets} (Expected: 11)`);
  console.log(`   - comments: ${counts.comments} (Expected: 6)`);
  console.log(`   - counters: ${counts.counters} (Expected: 1)`);

  if (counts.users !== 3 || counts.departments !== 4 || counts.tickets !== 11 || counts.comments !== 6 || counts.counters !== 1) {
    throw new Error('Count verification failed!');
  }
  console.log('   ✅ All collection counts match expected local backup state.\n');

  // 2. Ticket IDs
  console.log('2. Verifying Sequential Ticket IDs:');
  const tickets = await db.collection('tickets').find({}, { projection: { ticketId: 1, title: 1, status: 1, customerId: 1 } }).sort({ ticketId: 1 }).toArray();
  tickets.forEach(t => console.log(`   - ${t.ticketId}: "${t.title}" [${t.status}]`));
  const firstId = tickets[0].ticketId;
  const lastId = tickets[tickets.length - 1].ticketId;
  if (firstId !== 'TKT-1001' || lastId !== 'TKT-1011' || tickets.length !== 11) {
    throw new Error(`Ticket sequence verification failed: got ${firstId} to ${lastId}`);
  }
  console.log('   ✅ Ticket sequence exactly matches TKT-1001 through TKT-1011.\n');

  // 3. Counter State
  console.log('3. Verifying Counter State:');
  const counterDoc = await db.collection('counters').findOne({ _id: 'ticketId' });
  console.log(`   - Counter Doc: _id="${counterDoc._id}", seq=${counterDoc.seq}`);
  if (!counterDoc || counterDoc.seq !== 1011) {
    throw new Error(`Counter sequence failed: expected 1011, got ${counterDoc ? counterDoc.seq : 'null'}`);
  }
  console.log('   ✅ Counter is positioned at 1011 ready for TKT-1012 next.\n');

  // 4. Test Accounts & Bcrypt Passwords
  console.log('4. Verifying Test Accounts & Passwords:');
  const testAccounts = [
    { email: 'support@helpdesk.com', plain: 'support123', expectedRole: 'support' },
    { email: 'rahul@gmail.com', plain: 'customer123', expectedRole: 'customer' },
    { email: 'priya@gmail.com', plain: 'customer123', expectedRole: 'customer' },
  ];

  for (const acc of testAccounts) {
    const userDoc = await db.collection('users').findOne({ email: acc.email });
    if (!userDoc) {
      throw new Error(`User not found: ${acc.email}`);
    }
    const match = await bcrypt.compare(acc.plain, userDoc.password);
    if (!match) {
      throw new Error(`Password hash verification failed for ${acc.email}`);
    }
    console.log(`   ✅ ${acc.email} (${userDoc.role}) -> Password hash verified successfully.`);
  }

  // 5. Test next sequential ticket generation (atomic counter increment)
  console.log('\n5. Testing Sequential Ticket ID Generation on Atlas:');
  const updatedCounter = await db.collection('counters').findOneAndUpdate(
    { _id: 'ticketId' },
    { $inc: { seq: 1 } },
    { returnDocument: 'after' }
  );
  const nextSeq = updatedCounter.seq || updatedCounter.value?.seq;
  const nextTicketId = `TKT-${nextSeq}`;
  console.log(`   - Next generated Ticket ID: ${nextTicketId} (seq: ${nextSeq})`);
  if (nextTicketId !== 'TKT-1012') {
    throw new Error(`Expected TKT-1012, got ${nextTicketId}`);
  }

  // Rollback test increment so counter stays at 1011
  await db.collection('counters').updateOne(
    { _id: 'ticketId' },
    { $set: { seq: 1011 } }
  );
  console.log(`   - Rollback complete. Counter restored to seq: 1011`);
  console.log('   ✅ Sequential ID generator verified functional on Atlas.\n');

  console.log('=== ALL ATLAS VERIFICATIONS PASSED (5/5) ===');
  await client.close();
}

verifyAtlas().catch(err => {
  console.error('VERIFICATION ERROR:', err.message);
  process.exit(1);
});

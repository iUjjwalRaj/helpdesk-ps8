const BASE_URL = 'http://localhost:5001';

async function verifyLogins() {
  console.log('--- VERIFYING SEED CREDENTIALS ---\n');

  const accounts = [
    { email: 'support@helpdesk.com', password: 'support123', expectedRole: 'support' },
    { email: 'rahul@gmail.com', password: 'customer123', expectedRole: 'customer' },
    { email: 'priya@gmail.com', password: 'customer123', expectedRole: 'customer' },
  ];

  let allValid = true;

  for (const acc of accounts) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });
      const data = await res.json();

      if (res.status === 200 && data.token && data.role === acc.expectedRole) {
        console.log(`✅ ${acc.email} (${acc.expectedRole}) -> LOGIN SUCCESSFUL`);
      } else {
        console.error(`❌ ${acc.email} -> LOGIN FAILED:`, data);
        allValid = false;
      }
    } catch (err) {
      console.error(`❌ ${acc.email} -> ERROR:`, err.message);
      allValid = false;
    }
  }

  if (!allValid) process.exit(1);
  console.log('\n--- ALL LISTED SEED ACCOUNTS VERIFIED AND WORKING ---');
}

verifyLogins();

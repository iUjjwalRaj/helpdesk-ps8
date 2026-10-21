// Simple test script for Auth and MongoDB endpoints
const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('--- STARTING MILESTONE 2 AUTH TESTS ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', 'Health Check endpoint /api/health returns 200 OK');

    // 2. Customer Registration
    const timestamp = Date.now();
    const customerEmail = `customer_${timestamp}@test.com`;
    const regCustRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Customer',
        email: customerEmail,
        password: 'password123',
        role: 'customer'
      })
    });
    const regCustData = await regCustRes.json();
    assert(regCustRes.status === 201 && regCustData.role === 'customer' && !!regCustData.token, 'Register customer returns 201 and JWT token');
    const customerToken = regCustData.token;

    // 3. Support Staff Registration
    const supportEmail = `support_${timestamp}@test.com`;
    const regSuppRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Support',
        email: supportEmail,
        password: 'password123',
        role: 'support'
      })
    });
    const regSuppData = await regSuppRes.json();
    assert(regSuppRes.status === 201 && regSuppData.role === 'support' && !!regSuppData.token, 'Register support staff returns 201 and role=support');

    // 4. Duplicate Registration Rejection
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Alice',
        email: customerEmail,
        password: 'password123',
      })
    });
    assert(dupRes.status === 400, 'Duplicate email registration correctly rejected with 400 Bad Request');

    // 5. Short Password Rejection (< 6 chars)
    const shortPassRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pass',
        email: `short_${timestamp}@test.com`,
        password: '123'
      })
    });
    assert(shortPassRes.status === 400, 'Password < 6 chars rejected with 400 Bad Request');

    // 6. Login Customer with Correct Credentials
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerEmail,
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && !!loginData.token && loginData.role === 'customer', 'Login with valid credentials returns 200 and token');

    // 7. Login with Wrong Password
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerEmail,
        password: 'wrongpassword'
      })
    });
    assert(badLoginRes.status === 401, 'Login with incorrect password rejected with 401 Unauthorized');

    // 8. Access Protected Route (/api/auth/me) with Valid Token
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.email === customerEmail && !meData.password, 'Protected /api/auth/me returns profile and strips password');

    // 9. Access Protected Route without Token
    const noTokenRes = await fetch(`${BASE_URL}/api/auth/me`);
    assert(noTokenRes.status === 401, 'Accessing protected route without token rejected with 401 Unauthorized');

    // 10. Access Protected Route with Invalid Token
    const invalidTokenRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid.token.value' }
    });
    assert(invalidTokenRes.status === 401, 'Accessing protected route with fake token rejected with 401 Unauthorized');

  } catch (err) {
    console.error('Test script error:', err);
    failed++;
  }

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) process.exit(1);
}

runTests();

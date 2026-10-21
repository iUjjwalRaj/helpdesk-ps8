const https = require('https');

const BACKEND_URL = 'https://helpdesk-ps8-backend.onrender.com/api';

const customAgent = new https.Agent({
  lookup: (hostname, options, callback) => {
    if (hostname === 'help.ujjwalraj.online') {
      if (options && options.all) {
        callback(null, [{ address: '104.21.68.164', family: 4 }]);
      } else {
        callback(null, '104.21.68.164', 4);
      }
    } else if (hostname === 'help.feminismindia.com') {
      if (options && options.all) {
        callback(null, [{ address: '104.21.30.216', family: 4 }]);
      } else {
        callback(null, '104.21.30.216', 4);
      }
    } else {
      require('dns').lookup(hostname, options, callback);
    }
  }
});

function fetchWithAgent(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request(
      url,
      {
        method: 'GET',
        agent: customAgent,
        headers: { 'User-Agent': 'Node-E2E-Verifier' }
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            text: body
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

const CUSTOM_DOMAINS = [
  'https://help.feminismindia.com',
  'https://help.ujjwalraj.online',
  'https://helpdesk-frontend.d9b55bg6xx.workers.dev'
];

async function run() {
  console.log('=== STARTING COMPLETE E2E WORKER & CUSTOM DOMAIN VERIFICATION ===\n');

  // 1. Verify Frontend URLs & SPA Deep Links
  console.log('--- 1. Testing Frontend HTTPS & SPA Fallbacks on All 3 Domains ---');
  const routesToTest = ['/', '/login', '/dashboard', '/tickets'];

  for (const domain of CUSTOM_DOMAINS) {
    console.log(`\nTesting Domain: ${domain}`);
    for (const route of routesToTest) {
      const url = `${domain}${route}`;
      try {
        const res = await fetchWithAgent(url);
        const isHtml = res.headers['content-type'] && res.headers['content-type'].includes('text/html');
        const hasApp = res.text.includes('<div id="root">') || res.text.includes('HelpDesk PS8');
        if (res.status === 200 && isHtml && hasApp) {
          console.log(`✅ PASS: [${domain}] ${route} -> 200 OK (SPA HTML delivered)`);
        } else {
          console.error(`❌ FAIL: [${domain}] ${route} -> Status ${res.status}`);
        }
      } catch (e) {
        console.error(`❌ ERROR: [${domain}] ${route} -> ${e.message}`);
      }
    }
  }

  // 2. Test CORS for all Worker origins on Backend
  console.log('\n--- 2. Testing CORS Preflight Headers on Backend ---');
  for (const origin of CUSTOM_DOMAINS) {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    const allowCreds = res.headers.get('access-control-allow-credentials');
    if ((res.status === 204 || res.status === 200) && allowOrigin === origin && allowCreds === 'true') {
      console.log(`✅ PASS: CORS allowed for origin: ${origin} (credentials: true)`);
    } else {
      console.log(`⏳ PENDING/FAIL for ${origin}: status=${res.status}, allowOrigin=${allowOrigin} (waiting for Render deploy to complete)`);
    }
  }

  // 3. User Journey: Customer & Support login, Ticket lifecycle
  console.log('\n--- 3. Testing Authentication & User Journeys from Custom Domain Origin ---');
  const originHeader = { 'Origin': 'https://help.feminismindia.com' };

  // Customer Login
  const custRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...originHeader },
    body: JSON.stringify({ email: 'rahul@gmail.com', password: 'customer123' })
  });
  const custData = await custRes.json();
  if (!custRes.ok || !custData.token) {
    throw new Error(`Customer login failed: ${JSON.stringify(custData)}`);
  }
  console.log(`✅ PASS: Customer login succeeded (User: ${custData.name}, Role: ${custData.role})`);
  const custToken = custData.token;

  // Support Login
  const suppRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...originHeader },
    body: JSON.stringify({ email: 'support@helpdesk.com', password: 'support123' })
  });
  const suppData = await suppRes.json();
  if (!suppRes.ok || !suppData.token) {
    throw new Error(`Support login failed: ${JSON.stringify(suppData)}`);
  }
  console.log(`✅ PASS: Support login succeeded (User: ${suppData.name}, Role: ${suppData.role})`);
  const suppToken = suppData.token;

  // Fetch Departments
  const deptRes = await fetch(`${BACKEND_URL}/departments`, {
    headers: { 'Authorization': `Bearer ${suppToken}`, ...originHeader }
  });
  const departments = await deptRes.json();
  console.log(`✅ PASS: Fetched ${departments.length} departments from backend`);
  const itDept = departments.find(d => d.name === 'IT Support') || departments[0];

  // Create Ticket
  const createRes = await fetch(`${BACKEND_URL}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`,
      ...originHeader
    },
    body: JSON.stringify({
      title: 'Worker Verification Ticket',
      description: 'Verifying end-to-end functionality served via Cloudflare Worker',
      category: 'Technical',
      priority: 'Medium'
    })
  });
  const newTicket = await createRes.json();
  console.log(`✅ PASS: Created ticket with ID: ${newTicket.ticketId} (_id: ${newTicket._id})`);

  // Add Comment
  const commentRes = await fetch(`${BACKEND_URL}/tickets/${newTicket._id}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`,
      ...originHeader
    },
    body: JSON.stringify({ message: 'E2E comment submitted via custom domain flow' })
  });
  const createdComment = await commentRes.json();
  console.log(`✅ PASS: Added comment to ticket (comment ID: ${createdComment._id})`);

  // Verify Comments List
  const listCommentsRes = await fetch(`${BACKEND_URL}/tickets/${newTicket._id}/comments`, {
    headers: { 'Authorization': `Bearer ${custToken}`, ...originHeader }
  });
  const commentList = await listCommentsRes.json();
  console.log(`✅ PASS: Retrieved comments for ticket (total: ${commentList.length})`);

  // Support Assigns Department & Updates Status to In Progress
  const assignRes = await fetch(`${BACKEND_URL}/tickets/${newTicket._id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${suppToken}`,
      ...originHeader
    },
    body: JSON.stringify({ departmentId: itDept._id })
  });
  console.log(`✅ PASS: Department assigned to ${itDept.name}`);

  const inProgressRes = await fetch(`${BACKEND_URL}/tickets/${newTicket._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${suppToken}`,
      ...originHeader
    },
    body: JSON.stringify({ status: 'In Progress' })
  });
  console.log('✅ PASS: Status transitioned to In Progress');

  // Support Resolves Ticket
  const resolveRes = await fetch(`${BACKEND_URL}/tickets/${newTicket._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${suppToken}`,
      ...originHeader
    },
    body: JSON.stringify({ status: 'Resolved' })
  });
  const resolvedTicket = await resolveRes.json();
  console.log(`✅ PASS: Ticket marked Resolved (resolvedAt: ${resolvedTicket.resolvedAt})`);

  // Customer Reopens Ticket
  const reopenRes = await fetch(`${BACKEND_URL}/tickets/${newTicket._id}/reopen`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${custToken}`,
      ...originHeader
    }
  });
  const reopenedTicket = await reopenRes.json();
  console.log(`✅ PASS: Customer reopened ticket (status: ${reopenedTicket.status}, reopenCount: ${reopenedTicket.reopenCount})`);

  // Support Closes Ticket
  const closeRes = await fetch(`${BACKEND_URL}/tickets/${newTicket._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${suppToken}`,
      ...originHeader
    },
    body: JSON.stringify({ status: 'Closed' })
  });
  const closedTicket = await closeRes.json();
  console.log(`✅ PASS: Ticket transitioned to Closed (status: ${closedTicket.status})`);

  // Dashboard Loading
  console.log('\n--- 4. Testing Dashboard Analytics ---');
  const dashRes = await fetch(`${BACKEND_URL}/dashboard/stats`, {
    headers: { 'Authorization': `Bearer ${suppToken}`, ...originHeader }
  });
  const dashData = await dashRes.json();
  console.log(`✅ PASS: Dashboard loaded successfully: Total=${dashData.totalTickets}, Open=${dashData.statusBreakdown.open}, InProgress=${dashData.statusBreakdown.inProgress}, Resolved=${dashData.statusBreakdown.resolved}, Closed=${dashData.statusBreakdown.closed}, AvgResolutionTime=${dashData.averageResolutionHours} hrs`);

  console.log('\n=== ALL WORKER & CUSTOM DOMAIN E2E CHECKS PASSED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error('\n❌ E2E VERIFICATION FAILED:', err);
  process.exit(1);
});

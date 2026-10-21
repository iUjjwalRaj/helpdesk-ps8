// End-to-end production test suite running against Render deployed backend
const BASE_URL = 'https://helpdesk-ps8-backend.onrender.com';

async function runProductionTests() {
  console.log(`=== RUNNING FULL TEST SUITE AGAINST PRODUCTION BACKEND ===\nTarget: ${BASE_URL}\n`);
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
    // 1. Health & Config check
    console.log('--- STEP 1: Health & Diagnostics ---');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', 'Health Check endpoint returns 200 OK');
    assert(healthData.database === 'connected', `MongoDB Atlas connected: ${healthData.database}`);
    assert(healthData.isAtlasTarget === true, 'Database is confirmed MongoDB Atlas');
    console.log(`   Diagnostics: nodeEnv=${healthData.nodeEnv}, jwtConfigured=${healthData.jwtConfigured}, egressIp=${healthData.egressIp}\n`);

    // 2. Customer Login
    console.log('--- STEP 2: Customer Authentication ---');
    const custLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul@gmail.com', password: 'customer123' }),
    });
    const custData = await custLoginRes.json();
    assert(custLoginRes.status === 200 && custData.token, 'Customer login (rahul@gmail.com) successful');
    const custToken = custData.token;

    // 3. Support Login
    console.log('--- STEP 3: Support Authentication ---');
    const supLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'support@helpdesk.com', password: 'support123' }),
    });
    const supData = await supLoginRes.json();
    assert(supLoginRes.status === 200 && supData.role === 'support', 'Support login (support@helpdesk.com) successful');
    const supToken = supData.token;

    // 4. Fetch Departments
    console.log('--- STEP 4: Department Queries ---');
    const deptRes = await fetch(`${BASE_URL}/api/departments`, {
      headers: { Authorization: `Bearer ${supToken}` },
    });
    const departments = await deptRes.json();
    assert(deptRes.status === 200 && departments.length >= 4, `Fetched ${departments.length} departments successfully`);
    const targetDeptId = departments[0]._id;

    // 5. Create Ticket
    console.log('--- STEP 5: Ticket Creation & Sequential ID ---');
    const newTicketRes = await fetch(`${BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        title: 'Production Verification Test Ticket',
        description: 'Verifying end-to-end ticketing workflow on Render backend.',
        priority: 'Medium',
        category: 'Technical',
      }),
    });
    const newTicket = await newTicketRes.json();
    assert(newTicketRes.status === 201 && newTicket.ticketId && newTicket.ticketId.startsWith('TKT-'), `Ticket created with ID: ${newTicket.ticketId}`);
    const ticketMongoId = newTicket._id;

    // 6. Customer Comment
    console.log('--- STEP 6: Comment Threading ---');
    const commentRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({ message: 'Customer initial diagnostic follow-up message.' }),
    });
    const commentData = await commentRes.json();
    assert(commentRes.status === 201 && commentData.message, 'Customer added comment with timestamp and role');

    // 7. Customer Edit (Allowed on Open)
    console.log('--- STEP 7: Open Ticket Modification ---');
    const editRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({ title: 'Production Verification Test Ticket (Updated)' }),
    });
    assert(editRes.status === 200, 'Customer successfully edited Open ticket');

    // 8. Support Department Assignment & In Progress
    console.log('--- STEP 8: Department Assignment & Status Transition ---');
    const assignRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supToken}`,
      },
      body: JSON.stringify({
        status: 'In Progress',
        assignedDepartment: targetDeptId,
      }),
    });
    const assignedTicket = await assignRes.json();
    assert(assignRes.status === 200 && assignedTicket.status === 'In Progress', 'Support assigned department and advanced status to In Progress');

    // 9. Customer Edit Rejection on In Progress
    console.log('--- STEP 9: Business Rule: In Progress Edit Lock ---');
    const rejectEditRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({ title: 'Illegal Edit Attempt' }),
    });
    assert(rejectEditRes.status === 400, 'Customer edit on In Progress ticket correctly rejected with 400 Bad Request');

    // 10. Support Marks Resolved
    console.log('--- STEP 10: Status Transition to Resolved ---');
    const resolveRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supToken}`,
      },
      body: JSON.stringify({ status: 'Resolved' }),
    });
    const resolvedTicket = await resolveRes.json();
    assert(resolveRes.status === 200 && resolvedTicket.status === 'Resolved' && resolvedTicket.resolvedAt, 'Support marked Resolved and recorded resolvedAt timestamp');

    // 11. Customer Single Reopen
    console.log('--- STEP 11: One-Time Reopening ---');
    const reopenRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
    });
    const reopenedTicket = await reopenRes.json();
    assert(reopenRes.status === 200 && reopenedTicket.reopenCount === 1, 'Customer reopened ticket once (reopenCount = 1)');

    // 12. Customer 2nd Reopen Rejection
    const secondReopenRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
    });
    assert(secondReopenRes.status === 400, 'Customer attempting 2nd reopen correctly rejected with 400 Bad Request');

    // 13. Support Close
    console.log('--- STEP 12: Status Transition to Closed & Immutability ---');
    const closeRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supToken}`,
      },
      body: JSON.stringify({ status: 'Closed' }),
    });
    assert(closeRes.status === 200, 'Support transitioned ticket to Closed');

    // Closed immutability check
    const closedCommentRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({ text: 'Comment on closed ticket' }),
    });
    assert(closedCommentRes.status === 400, 'Commenting on Closed ticket rejected with 400 Bad Request');

    // 14. Dashboard Analytics
    console.log('--- STEP 13: Dashboard Metrics & Analytics ---');
    const dashRes = await fetch(`${BASE_URL}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${supToken}` },
    });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200 && typeof dashData.totalTickets === 'number', `Dashboard returned ${dashData.totalTickets} total tickets`);
    assert(typeof dashData.statusBreakdown?.open === 'number' && typeof dashData.statusBreakdown?.resolved === 'number', 'Dashboard breakdown counts validated');
    console.log(`   Metrics: total=${dashData.totalTickets}, open=${dashData.statusBreakdown.open}, inProgress=${dashData.statusBreakdown.inProgress}, resolved=${dashData.statusBreakdown.resolved}, closed=${dashData.statusBreakdown.closed}, avgResolutionTime=${dashData.averageResolutionHours} hrs\n`);

    console.log(`\n=== PRODUCTION VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Fatal Production Test Error:', err.message);
    process.exit(1);
  }
}

runProductionTests();

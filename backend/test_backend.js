// Comprehensive test script verifying all PS8 backend business rules
const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE BACKEND BUSINESS RULES TESTS ---\n');
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
    const timestamp = Date.now();

    // 1. Register Customer
    const custRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carlos Customer',
        email: `carlos_${timestamp}@test.com`,
        password: 'password123',
        role: 'customer'
      })
    });
    const custData = await custRes.json();
    const custToken = custData.token;
    assert(custRes.status === 201 && !!custToken, 'Registered customer successfully');

    // 2. Register Support Staff
    const suppRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Support',
        email: `sarah_${timestamp}@test.com`,
        password: 'password123',
        role: 'support'
      })
    });
    const suppData = await suppRes.json();
    const suppToken = suppData.token;
    assert(suppRes.status === 201 && suppData.role === 'support', 'Registered support staff successfully');

    // 3. Department Creation: Customer forbidden (403)
    const custDeptRes = await fetch(`${BASE_URL}/api/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`
      },
      body: JSON.stringify({ name: `IT Support ${timestamp}`, description: 'Technical support' })
    });
    assert(custDeptRes.status === 403, 'Customer cannot create department (403 Forbidden)');

    // 4. Department Creation: Support allowed (201)
    const suppDeptRes = await fetch(`${BASE_URL}/api/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suppToken}`
      },
      body: JSON.stringify({ name: `IT Support ${timestamp}`, description: 'Technical support' })
    });
    const deptData = await suppDeptRes.json();
    assert(suppDeptRes.status === 201 && !!deptData._id, 'Support staff can create department (201 Created)');
    const departmentId = deptData._id;

    // 5. Customer Creates Ticket -> readable ticketId (TKT-xxxx)
    const ticketRes = await fetch(`${BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`
      },
      body: JSON.stringify({
        title: 'VPN Connection Failure',
        category: 'Technical',
        priority: 'High',
        description: 'Unable to connect to company VPN from remote location',
        department: departmentId
      })
    });
    const ticketData = await ticketRes.json();
    assert(ticketRes.status === 201 && /^TKT-\d+$/.test(ticketData.ticketId) && ticketData.status === 'Open',
      `Ticket created with readable ID: ${ticketData.ticketId} and status 'Open'`);
    const ticketMongoId = ticketData._id;

    // 6. Customer Edits Ticket while status is 'Open' (Allowed)
    const editRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`
      },
      body: JSON.stringify({ title: 'VPN Connection Failure - Updated' })
    });
    const editData = await editRes.json();
    assert(editRes.status === 200 && editData.title.includes('Updated'), 'Customer can edit ticket while status is Open');

    // 7. Add Comment to Open Ticket
    const commentRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`
      },
      body: JSON.stringify({ message: 'I tried restarting my router, still not working.' })
    });
    const commentData = await commentRes.json();
    assert(commentRes.status === 201 && commentData.authorRole === 'customer', 'Customer can add comment with author and timestamp');

    // 8. Support updates status to 'In Progress'
    const statusProgRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suppToken}`
      },
      body: JSON.stringify({ status: 'In Progress' })
    });
    assert(statusProgRes.status === 200, "Support can advance status to 'In Progress'");

    // 9. Customer tries to edit ticket while 'In Progress' (Must be rejected with 400)
    const illegalEditRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`
      },
      body: JSON.stringify({ title: 'Illegal Edit Attempt' })
    });
    assert(illegalEditRes.status === 400, "Customer CANNOT edit ticket when status is 'In Progress' (400 Bad Request)");

    // 10. Customer tries to delete ticket while 'In Progress' (Must be rejected with 400)
    const illegalDelRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${custToken}` }
    });
    assert(illegalDelRes.status === 400, "Customer CANNOT delete ticket when status is 'In Progress' (400 Bad Request)");

    // 11. Support marks ticket as 'Resolved'
    const statusResolvedRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suppToken}`
      },
      body: JSON.stringify({ status: 'Resolved' })
    });
    const resolvedData = await statusResolvedRes.json();
    assert(statusResolvedRes.status === 200 && resolvedData.status === 'Resolved' && !!resolvedData.resolvedAt,
      "Support can mark ticket 'Resolved' and sets resolvedAt timestamp");

    // 12. Reopening: Customer reopens ticket (1st time -> Allowed)
    const reopen1Res = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/reopen`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${custToken}` }
    });
    const reopen1Data = await reopen1Res.json();
    assert(reopen1Res.status === 200 && reopen1Data.status === 'In Progress' && reopen1Data.reopenCount === 1,
      'Resolved ticket successfully reopened once (reopenCount = 1)');

    // 13. Support marks resolved again
    await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suppToken}`
      },
      body: JSON.stringify({ status: 'Resolved' })
    });

    // 14. Reopening: Customer tries to reopen a 2nd time (Must be rejected with 400)
    const reopen2Res = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/reopen`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${custToken}` }
    });
    assert(reopen2Res.status === 400, 'Resolved ticket CANNOT be reopened a second time (400 Bad Request)');

    // 15. Support closes ticket ('Closed')
    const closeRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suppToken}`
      },
      body: JSON.stringify({ status: 'Closed' })
    });
    assert(closeRes.status === 200, "Support can advance status to 'Closed'");

    // 16. Closed ticket is read-only: no edits, status change, or comments permitted
    const commentOnClosedRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`
      },
      body: JSON.stringify({ message: 'Trying to comment on closed ticket' })
    });
    assert(commentOnClosedRes.status === 400, 'Commenting on Closed ticket is rejected (400 Bad Request: Closed is read-only)');

    const statusChangeOnClosedRes = await fetch(`${BASE_URL}/api/tickets/${ticketMongoId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suppToken}`
      },
      body: JSON.stringify({ status: 'Open' })
    });
    assert(statusChangeOnClosedRes.status === 400, 'Changing status of Closed ticket is rejected (400 Bad Request)');

    // 17. Dashboard Stats Endpoint
    const statsRes = await fetch(`${BASE_URL}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${suppToken}` }
    });
    const stats = await statsRes.json();
    assert(statsRes.status === 200 && stats.totalTickets >= 1 && stats.statusBreakdown && stats.categoryBreakdown,
      'Dashboard stats returned accurate aggregated counts and breakdowns');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) process.exit(1);
}

runTests();

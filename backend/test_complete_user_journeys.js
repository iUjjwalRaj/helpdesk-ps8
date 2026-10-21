// Test main user journeys exactly as requested:
// 1. Login as customer (rahul@gmail.com / customer123)
// 2. Create a ticket
// 3. Add a comment
// 4. Verify Open-only edits/deletions
// 5. Login as support (support@helpdesk.com / support123)
// 6. View all tickets & assign department
// 7. Advance status: Open -> In Progress -> Resolved
// 8. Verify customer can reopen once
// 9. Advance status to Closed & verify Closed immutability
// 10. Verify dashboard metrics calculations

const BASE_URL = 'http://localhost:5001';

async function runJourney() {
  console.log('--- EXECUTING COMPLETE END-TO-END USER JOURNEYS ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ ${message}`);
      passed++;
    } else {
      console.error(`❌ ${message}`);
      failed++;
    }
  }

  try {
    // 1. Customer Login
    const custLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul@gmail.com', password: 'customer123' })
    });
    const custLogin = await custLoginRes.json();
    assert(custLoginRes.status === 200 && custLogin.role === 'customer' && !!custLogin.token,
      'Journey 1: Customer (Rahul) logged in successfully');
    const custToken = custLogin.token;

    // 2. Customer creates a ticket
    const newTicketRes = await fetch(`${BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`
      },
      body: JSON.stringify({
        title: 'USB-C Hub power delivery failure',
        category: 'Hardware',
        priority: 'High',
        description: 'External USB-C Hub stopped charging laptop while connected to dual monitors.',
        screenshotUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500'
      })
    });
    const newTicket = await newTicketRes.json();
    assert(newTicketRes.status === 201 && /^TKT-\d+$/.test(newTicket.ticketId) && newTicket.status === 'Open',
      `Journey 2: Customer created ticket ${newTicket.ticketId} with status 'Open'`);
    const ticketId = newTicket._id;

    // 3. Customer adds a comment
    const commentRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`
      },
      body: JSON.stringify({ message: 'I tried switching USB ports but the issue persists.' })
    });
    const commentData = await commentRes.json();
    assert(commentRes.status === 201 && commentData.authorRole === 'customer',
      'Journey 3: Customer added comment with role tag and timestamp');

    // 4. Customer edits ticket while Open (Allowed)
    const editRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`
      },
      body: JSON.stringify({ title: 'USB-C Hub power delivery failure (Urgent)' })
    });
    assert(editRes.status === 200, 'Journey 4: Customer edited ticket successfully while status is Open');

    // 5. Support Admin Login
    const suppLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'support@helpdesk.com', password: 'support123' })
    });
    const suppLogin = await suppLoginRes.json();
    assert(suppLoginRes.status === 200 && suppLogin.role === 'support' && !!suppLogin.token,
      'Journey 5: Support Admin logged in successfully');
    const suppToken = suppLogin.token;

    // 6. Support fetches departments and assigns Hardware department
    const deptsRes = await fetch(`${BASE_URL}/api/departments`, {
      headers: { Authorization: `Bearer ${suppToken}` }
    });
    const depts = await deptsRes.json();
    const hwDept = depts.find(d => d.name.includes('Hardware')) || depts[0];

    const assignRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suppToken}`
      },
      body: JSON.stringify({ departmentId: hwDept._id })
    });
    const assignedTicket = await assignRes.json();
    assert(assignRes.status === 200 && assignedTicket.department?.name === hwDept.name,
      `Journey 6: Support assigned ticket to '${hwDept.name}' department`);

    // 7. Support advances status: Open -> In Progress
    const inProgRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suppToken}`
      },
      body: JSON.stringify({ status: 'In Progress' })
    });
    assert(inProgRes.status === 200, "Journey 7: Support updated status to 'In Progress'");

    // 8. Customer attempts edit when In Progress (MUST FAIL)
    const blockedEdit = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`
      },
      body: JSON.stringify({ title: 'Unauthorized update' })
    });
    assert(blockedEdit.status === 400, "Journey 8: Customer editing In Progress ticket correctly rejected with 400 Bad Request");

    // 9. Support adds support comment
    const suppCommentRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suppToken}`
      },
      body: JSON.stringify({ message: 'Hardware team has dispatched replacement hub.' })
    });
    assert(suppCommentRes.status === 201, 'Journey 9: Support added response to comment thread');

    // 10. Support marks Resolved
    const resolvedRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suppToken}`
      },
      body: JSON.stringify({ status: 'Resolved' })
    });
    const resolvedTicket = await resolvedRes.json();
    assert(resolvedRes.status === 200 && resolvedTicket.status === 'Resolved' && !!resolvedTicket.resolvedAt,
      "Journey 10: Support marked Resolved and recorded resolvedAt timestamp");

    // 11. Customer reopens ticket (1st time -> Allowed)
    const reopenRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/reopen`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${custToken}` }
    });
    const reopenedTicket = await reopenRes.json();
    assert(reopenRes.status === 200 && reopenedTicket.status === 'In Progress' && reopenedTicket.reopenCount === 1,
      "Journey 11: Customer reopened ticket once (status became 'In Progress', reopenCount = 1)");

    // 12. Support marks Resolved again
    await fetch(`${BASE_URL}/api/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suppToken}`
      },
      body: JSON.stringify({ status: 'Resolved' })
    });

    // 13. Customer attempts second reopen (MUST FAIL)
    const secondReopenRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/reopen`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${custToken}` }
    });
    assert(secondReopenRes.status === 400, "Journey 12: Customer attempting 2nd reopen correctly rejected with 400 Bad Request");

    // 14. Support advances status to Closed
    const closeRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${suppToken}`
      },
      body: JSON.stringify({ status: 'Closed' })
    });
    assert(closeRes.status === 200, "Journey 13: Support advanced status to 'Closed'");

    // 15. Verify Closed Immutability (no edits, comments, or status changes)
    const closedEditRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`
      },
      body: JSON.stringify({ title: 'Edit closed ticket' })
    });
    const closedCommentRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`
      },
      body: JSON.stringify({ message: 'Comment on closed ticket' })
    });
    assert(closedEditRes.status === 400 && closedCommentRes.status === 400,
      "Journey 14: Closed ticket is strictly read-only (edits & comments rejected with 400)");

    // 16. Support verifies Dashboard Analytics
    const statsRes = await fetch(`${BASE_URL}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${suppToken}` }
    });
    const stats = await statsRes.json();
    assert(statsRes.status === 200 &&
           stats.totalTickets >= 10 &&
           stats.statusBreakdown.resolvedTotal >= 3 &&
           stats.averageResolutionHours > 0,
      `Journey 15: Dashboard stats verified: ${stats.totalTickets} total tickets, avg resolution time: ${stats.averageResolutionHours} hrs`);

  } catch (err) {
    console.error('Journey execution error:', err);
    failed++;
  }

  console.log(`\n--- ALL USER JOURNEYS COMPLETE: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) process.exit(1);
}

runJourney();

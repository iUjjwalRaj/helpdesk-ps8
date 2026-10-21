const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Department = require('../models/Department');
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const Counter = require('../models/Counter');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data cleanly
    await User.deleteMany();
    await Department.deleteMany();
    await Ticket.deleteMany();
    await Comment.deleteMany();
    await Counter.deleteMany();

    console.log('Cleared existing collections.');

    // Initialize Counter to 1000 so tickets begin at TKT-1001
    await Counter.create({ _id: 'ticketId', seq: 1000 });

    // 1. Create Users
    const salt = await bcrypt.genSalt(10);
    const supportPassword = await bcrypt.hash('support123', salt);
    const customerPassword = await bcrypt.hash('customer123', salt);

    const supportUser = await User.create({
      name: 'Support Admin',
      email: 'support@helpdesk.com',
      password: supportPassword,
      role: 'support',
    });

    const customer1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      password: customerPassword,
      role: 'customer',
    });

    const customer2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@gmail.com',
      password: customerPassword,
      role: 'customer',
    });

    console.log('Created Users: Support Admin, Rahul Sharma, Priya Patel');

    // 2. Create Departments
    const deptIT = await Department.create({
      name: 'IT Support',
      description: 'VPN, enterprise software, network access, and workstation setup',
    });

    const deptBilling = await Department.create({
      name: 'Billing & Finance',
      description: 'Invoicing, subscriptions, charge disputes, and refunds',
    });

    const deptHardware = await Department.create({
      name: 'Hardware & Infrastructure',
      description: 'Laptops, secondary monitors, docking stations, and peripherals',
    });

    const deptAccount = await Department.create({
      name: 'Account Administration',
      description: 'Single Sign-On (SSO), 2FA resets, and permission management',
    });

    console.log('Created 4 Departments.');

    // 3. Create 10 Realistic Tickets
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 3600 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 3600 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000);

    const ticketsData = [
      {
        ticketId: 'TKT-1001',
        customer: customer1._id,
        department: deptIT._id,
        title: 'Unable to connect to GlobalProtect VPN from home',
        category: 'Technical',
        priority: 'High',
        description: 'Receiving error code 503 Gateway Timeout whenever attempting connection via the home fiber connection.',
        screenshotUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500',
        status: 'In Progress',
        createdAt: twoDaysAgo,
      },
      {
        ticketId: 'TKT-1002',
        customer: customer2._id,
        department: deptBilling._id,
        title: 'Charged twice for monthly enterprise subscription',
        category: 'Billing',
        priority: 'High',
        description: 'My credit card statement shows two identical debits of $49.00 on the 15th of this month. Please refund the duplicate.',
        screenshotUrl: '',
        status: 'Resolved',
        createdAt: twoDaysAgo,
        resolvedAt: oneDayAgo, // 24 hours resolution time
        reopenCount: 0,
      },
      {
        ticketId: 'TKT-1003',
        customer: customer1._id,
        department: deptHardware._id,
        title: 'Secondary Dell 27-inch monitor flickering black intermittently',
        category: 'Hardware',
        priority: 'Medium',
        description: 'The USB-C display link disconnects every 15 minutes when using the secondary external display.',
        screenshotUrl: '',
        status: 'Open',
        createdAt: oneDayAgo,
      },
      {
        ticketId: 'TKT-1004',
        customer: customer2._id,
        department: deptAccount._id,
        title: 'Locked out of Okta SSO after changing mobile phone',
        category: 'Account',
        priority: 'Urgent',
        description: 'Switched to a new phone and lost access to Okta Verify authenticator app. Need emergency 2FA reset.',
        screenshotUrl: '',
        status: 'In Progress',
        createdAt: oneDayAgo,
      },
      {
        ticketId: 'TKT-1005',
        customer: customer1._id,
        department: deptIT._id,
        title: 'Requesting Docker Desktop and Node.js LTS license installation',
        category: 'Technical',
        priority: 'Low',
        description: 'Need administrative approval for developer tools required for the new sprint.',
        screenshotUrl: '',
        status: 'Closed',
        createdAt: twoDaysAgo,
        resolvedAt: oneDayAgo,
        closedAt: fourHoursAgo,
        reopenCount: 0,
      },
      {
        ticketId: 'TKT-1006',
        customer: customer2._id,
        department: deptBilling._id,
        title: 'Request updated tax invoice with company GST number',
        category: 'Billing',
        priority: 'Low',
        description: 'Please add GSTIN: 27AAAAA0000A1Z5 to invoice #INV-9821 and reissue PDF for accounting.',
        screenshotUrl: '',
        status: 'Resolved',
        createdAt: oneDayAgo,
        resolvedAt: twoHoursAgo, // 22 hours resolution
        reopenCount: 0,
      },
      {
        ticketId: 'TKT-1007',
        customer: customer1._id,
        department: deptHardware._id,
        title: 'Laptop battery draining within 45 minutes on full charge',
        category: 'Hardware',
        priority: 'Medium',
        description: 'MacBook battery health indicator reports Service Recommended. Need diagnostic check or replacement battery.',
        screenshotUrl: '',
        status: 'Open',
        createdAt: fourHoursAgo,
      },
      {
        ticketId: 'TKT-1008',
        customer: customer2._id,
        department: deptAccount._id,
        title: 'Need access to Marketing shared Google Drive folder',
        category: 'Account',
        priority: 'Low',
        description: 'Joined the Q4 product launch team and require editor permissions for the campaign asset drive.',
        screenshotUrl: '',
        status: 'Open',
        createdAt: twoHoursAgo,
      },
      {
        ticketId: 'TKT-1009',
        customer: customer1._id,
        department: deptIT._id,
        title: 'Internal staging server returning 502 Bad Gateway',
        category: 'Technical',
        priority: 'Urgent',
        description: 'The staging deployment pipeline failed after the last Nginx configuration merge. QA testing is blocked.',
        screenshotUrl: '',
        status: 'In Progress',
        createdAt: oneDayAgo,
      },
      {
        ticketId: 'TKT-1010',
        customer: customer2._id,
        department: deptIT._id,
        title: 'Security awareness training completion not reflected in portal',
        category: 'Other',
        priority: 'Low',
        description: 'Completed the annual compliance module yesterday but HR portal still shows pending deadline warning.',
        screenshotUrl: '',
        status: 'Closed',
        createdAt: twoDaysAgo,
        resolvedAt: oneDayAgo,
        closedAt: twoHoursAgo,
        reopenCount: 1, // Example of reopened and then closed
      },
    ];

    const createdTickets = await Ticket.insertMany(ticketsData);
    console.log(`Created ${createdTickets.length} realistic tickets.`);

    // Update Counter to 1010
    await Counter.findByIdAndUpdate('ticketId', { seq: 1010 });

    // 4. Create Comments on several tickets
    const commentsData = [
      {
        ticket: createdTickets[0]._id, // TKT-1001
        author: supportUser._id,
        authorRole: 'support',
        message: 'Hello Rahul, we have escalated this to the Network engineering team. Please confirm your current public IP address.',
        createdAt: oneDayAgo,
      },
      {
        ticket: createdTickets[0]._id, // TKT-1001
        author: customer1._id,
        authorRole: 'customer',
        message: 'My public IP is 115.240.89.12. Looking forward to the update.',
        createdAt: fourHoursAgo,
      },
      {
        ticket: createdTickets[1]._id, // TKT-1002
        author: supportUser._id,
        authorRole: 'support',
        message: 'Duplicate charge verified. Refund of $49.00 has been processed to your original payment method (ARN: 8912837198).',
        createdAt: oneDayAgo,
      },
      {
        ticket: createdTickets[3]._id, // TKT-1004
        author: supportUser._id,
        authorRole: 'support',
        message: 'We have initiated an identity verification call to your registered mobile number.',
        createdAt: fourHoursAgo,
      },
    ];

    await Comment.insertMany(commentsData);
    console.log('Created sample comment threads.');

    console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');
    console.log('Sample Logins:');
    console.log('  Support Staff: support@helpdesk.com / support123');
    console.log('  Customer 1:    rahul@gmail.com   / customer123');
    console.log('  Customer 2:    priya@gmail.com   / customer123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();

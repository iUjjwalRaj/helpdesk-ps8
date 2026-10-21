const Ticket = require('../models/Ticket');
const Counter = require('../models/Counter');
const Comment = require('../models/Comment');

// Helper to generate sequential atomic ticket IDs (e.g. TKT-1001, TKT-1002)
const getNextTicketId = async () => {
  let counter = await Counter.findById('ticketId');
  if (!counter) {
    await Counter.create({ _id: 'ticketId', seq: 1000 });
  }
  counter = await Counter.findByIdAndUpdate(
    'ticketId',
    { $inc: { seq: 1 } },
    { new: true }
  );
  return `TKT-${counter.seq}`;
};

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Private (Authenticated users)
const createTicket = async (req, res) => {
  try {
    const { title, category, priority, description, screenshotUrl, department } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ message: 'Title, category, and description are required' });
    }

    const ticketId = await getNextTicketId();

    const ticket = await Ticket.create({
      ticketId,
      customer: req.user._id,
      title: title.trim(),
      category,
      priority: priority || 'Medium',
      description: description.trim(),
      screenshotUrl: screenshotUrl ? screenshotUrl.trim() : '',
      department: department || null,
      status: 'Open',
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('customer', 'name email role')
      .populate('department', 'name');

    res.status(201).json(populatedTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Failed to create ticket', error: error.message });
  }
};

// @desc    Get tickets (Customer sees own tickets; Support sees all with optional filters)
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
  try {
    const query = {};

    // Customers can only see their own tickets
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    }

    // Support staff can apply filters
    if (req.user.role === 'support') {
      if (req.query.status) query.status = req.query.status;
      if (req.query.priority) query.priority = req.query.priority;
      if (req.query.category) query.category = req.query.category;
      if (req.query.department) query.department = req.query.department;
    }

    const tickets = await Ticket.find(query)
      .populate('customer', 'name email role')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
};

// @desc    Get single ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'name email role')
      .populate('department', 'name');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Enforce ownership: Customers can only view their own ticket
    if (req.user.role === 'customer' && ticket.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: not your ticket' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Failed to fetch ticket' });
  }
};

// @desc    Update ticket content (Title, description, category, priority, screenshot)
// @route   PUT /api/tickets/:id
// @access  Private (Customer owner only)
const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check ownership
    if (req.user.role === 'customer' && ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: cannot edit another user\'s ticket' });
    }

    // Rule: Closed tickets are read-only
    if (ticket.status === 'Closed') {
      return res.status(400).json({ message: 'Closed tickets are read-only and cannot be modified' });
    }

    // Rule: Customer can ONLY edit while status is 'Open'
    if (ticket.status !== 'Open') {
      return res.status(400).json({
        message: `Ticket cannot be edited because its status is '${ticket.status}'. Editing is only permitted when status is 'Open'.`,
      });
    }

    const { title, category, priority, description, screenshotUrl } = req.body;
    if (title) ticket.title = title.trim();
    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;
    if (description) ticket.description = description.trim();
    if (screenshotUrl !== undefined) ticket.screenshotUrl = screenshotUrl.trim();

    const updatedTicket = await ticket.save();
    const populated = await Ticket.findById(updatedTicket._id)
      .populate('customer', 'name email role')
      .populate('department', 'name');

    res.json(populated);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private (Customer owner only)
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check ownership
    if (req.user.role === 'customer' && ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: cannot delete another user\'s ticket' });
    }

    // Rule: Closed tickets cannot be deleted
    if (ticket.status === 'Closed') {
      return res.status(400).json({ message: 'Closed tickets are read-only and cannot be deleted' });
    }

    // Rule: Customer can ONLY delete while status is 'Open'
    if (ticket.status !== 'Open') {
      return res.status(400).json({
        message: `Ticket cannot be deleted because its status is '${ticket.status}'. Deletion is only permitted when status is 'Open'.`,
      });
    }

    // Delete associated comments
    await Comment.deleteMany({ ticket: ticket._id });
    await ticket.deleteOne();

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ message: 'Failed to delete ticket' });
  }
};

// @desc    Update ticket status (Workflow: Open -> In Progress -> Resolved -> Closed)
// @route   PATCH /api/tickets/:id/status
// @access  Private (Support only)
const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Rule: Closed tickets cannot be modified
    if (ticket.status === 'Closed') {
      return res.status(400).json({ message: 'Closed tickets are read-only and cannot change status' });
    }

    ticket.status = status;

    // Record resolution and closure timestamps
    if (status === 'Resolved' && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }
    if (status === 'Closed' && !ticket.closedAt) {
      ticket.closedAt = new Date();
    }

    const updated = await ticket.save();
    const populated = await Ticket.findById(updated._id)
      .populate('customer', 'name email role')
      .populate('department', 'name');

    res.json(populated);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Failed to update ticket status' });
  }
};

// @desc    Reopen a resolved ticket (Permitted strictly ONCE)
// @route   POST /api/tickets/:id/reopen
// @access  Private (Customer owner or Support)
const reopenTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check ownership if customer
    if (req.user.role === 'customer' && ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: not your ticket' });
    }

    // Rule: Ticket must currently be 'Resolved'
    if (ticket.status !== 'Resolved') {
      return res.status(400).json({
        message: `Only tickets with 'Resolved' status can be reopened. Current status is '${ticket.status}'.`,
      });
    }

    // Rule: Can only be reopened ONCE
    if (ticket.reopenCount >= 1) {
      return res.status(400).json({
        message: 'This ticket has already been reopened once and cannot be reopened again.',
      });
    }

    ticket.status = 'In Progress';
    ticket.reopenCount += 1;
    ticket.resolvedAt = null; // Reset resolution timestamp

    const updated = await ticket.save();
    const populated = await Ticket.findById(updated._id)
      .populate('customer', 'name email role')
      .populate('department', 'name');

    res.json(populated);
  } catch (error) {
    console.error('Error reopening ticket:', error);
    res.status(500).json({ message: 'Failed to reopen ticket' });
  }
};

// @desc    Assign ticket to a department
// @route   PATCH /api/tickets/:id/assign
// @access  Private (Support only)
const assignDepartment = async (req, res) => {
  try {
    const { departmentId } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Rule: Closed tickets cannot be modified
    if (ticket.status === 'Closed') {
      return res.status(400).json({ message: 'Closed tickets are read-only' });
    }

    ticket.department = departmentId || null;

    const updated = await ticket.save();
    const populated = await Ticket.findById(updated._id)
      .populate('customer', 'name email role')
      .populate('department', 'name');

    res.json(populated);
  } catch (error) {
    console.error('Error assigning department:', error);
    res.status(500).json({ message: 'Failed to assign department' });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
  reopenTicket,
  assignDepartment,
};

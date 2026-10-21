const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');

// @desc    Add a comment to a ticket
// @route   POST /api/tickets/:ticketId/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Comment message is required' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Rule: Closed tickets are read-only
    if (ticket.status === 'Closed') {
      return res.status(400).json({ message: 'Closed tickets are read-only. No new comments allowed.' });
    }

    // Rule: Customers can only comment on their own tickets
    if (req.user.role === 'customer' && ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: cannot comment on another user\'s ticket' });
    }

    const comment = await Comment.create({
      ticket: ticket._id,
      author: req.user._id,
      authorRole: req.user.role,
      message: message.trim(),
    });

    const populated = await Comment.findById(comment._id).populate('author', 'name email role');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

// @desc    Get all comments for a ticket
// @route   GET /api/tickets/:ticketId/comments
// @access  Private
const getComments = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check ownership if customer
    if (req.user.role === 'customer' && ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: not your ticket' });
    }

    const comments = await Comment.find({ ticket: ticketId })
      .populate('author', 'name email role')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

module.exports = {
  addComment,
  getComments,
};

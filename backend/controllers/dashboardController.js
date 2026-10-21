const Ticket = require('../models/Ticket');
const Department = require('../models/Department');
const User = require('../models/User');

// @desc    Get dashboard statistics & metrics
// @route   GET /api/dashboard/stats
// @access  Private (Support only)
const getDashboardStats = async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();

    // Status counts
    const openCount = await Ticket.countDocuments({ status: 'Open' });
    const inProgressCount = await Ticket.countDocuments({ status: 'In Progress' });
    const resolvedCount = await Ticket.countDocuments({ status: 'Resolved' });
    const closedCount = await Ticket.countDocuments({ status: 'Closed' });

    // Category breakdown
    const categories = ['Technical', 'Billing', 'Account', 'Hardware', 'Other'];
    const categoryBreakdown = {};
    for (const cat of categories) {
      categoryBreakdown[cat] = await Ticket.countDocuments({ category: cat });
    }

    // Priority breakdown
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    const priorityBreakdown = {};
    for (const prio of priorities) {
      priorityBreakdown[prio] = await Ticket.countDocuments({ priority: prio });
    }

    // Average Resolution Time (in hours)
    // Find all tickets that have a valid resolvedAt date
    const resolvedTickets = await Ticket.find({
      resolvedAt: { $ne: null },
    }).select('createdAt resolvedAt');

    let averageResolutionHours = 0;
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((acc, tkt) => {
        const diffMs = new Date(tkt.resolvedAt) - new Date(tkt.createdAt);
        const hours = Math.max(0, diffMs / (1000 * 60 * 60));
        return acc + hours;
      }, 0);
      averageResolutionHours = Number((totalHours / resolvedTickets.length).toFixed(1));
    }

    // Additional counts for dashboard overview
    const totalDepartments = await Department.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    res.json({
      totalTickets,
      statusBreakdown: {
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
        activeTotal: openCount + inProgressCount,
        resolvedTotal: resolvedCount + closedCount,
      },
      categoryBreakdown,
      priorityBreakdown,
      averageResolutionHours,
      resolvedTicketsCount: resolvedTickets.length,
      totalDepartments,
      totalCustomers,
    });
  } catch (error) {
    console.error('Error computing dashboard metrics:', error);
    res.status(500).json({ message: 'Failed to compute dashboard metrics' });
  }
};

module.exports = {
  getDashboardStats,
};

const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
  reopenTicket,
  assignDepartment,
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, getTickets)
  .post(protect, createTicket);

router.route('/:id')
  .get(protect, getTicketById)
  .put(protect, updateTicket)
  .delete(protect, deleteTicket);

router.patch('/:id/status', protect, authorizeRoles('support'), updateTicketStatus);
router.post('/:id/reopen', protect, reopenTicket);
router.patch('/:id/assign', protect, authorizeRoles('support'), assignDepartment);

// Re-route into comment router for /api/tickets/:ticketId/comments
const commentRouter = require('./commentRoutes');
router.use('/:ticketId/comments', commentRouter);

module.exports = router;

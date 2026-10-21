const express = require('express');
const router = express.Router({ mergeParams: true });
const { addComment, getComments } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getComments)
  .post(protect, addComment);

module.exports = router;

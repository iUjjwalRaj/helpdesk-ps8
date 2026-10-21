const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', protect, getDepartments);
router.post('/', protect, authorizeRoles('support'), createDepartment);
router.put('/:id', protect, authorizeRoles('support'), updateDepartment);
router.delete('/:id', protect, authorizeRoles('support'), deleteDepartment);

module.exports = router;

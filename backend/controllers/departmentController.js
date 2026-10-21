const Department = require('../models/Department');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (Authenticated users)
const getDepartments = async (req, res) => {
  try {
    // If support staff, return all. If customer, return active departments.
    const filter = req.user.role === 'support' ? {} : { isActive: true };
    const departments = await Department.find(filter).sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
};

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private (Support only)
const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Department with this name already exists' });
    }

    const department = await Department.create({
      name: name.trim(),
      description: description ? description.trim() : '',
    });

    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Failed to create department' });
  }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private (Support only)
const updateDepartment = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (name) department.name = name.trim();
    if (description !== undefined) department.description = description.trim();
    if (isActive !== undefined) department.isActive = Boolean(isActive);

    const updated = await department.save();
    res.json(updated);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Failed to update department' });
  }
};

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private (Support only)
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    await department.deleteOne();
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Failed to delete department' });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};

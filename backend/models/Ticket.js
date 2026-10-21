const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Technical', 'Billing', 'Account', 'Hardware', 'Other'],
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    screenshotUrl: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    reopenCount: {
      type: Number,
      default: 0,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Ticket', ticketSchema);

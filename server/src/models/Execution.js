const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
      index: true,
    },
    workflowSnapshot: {
      type: Object,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    currentNode: {
      type: String,
      default: null,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0, // In milliseconds
    },
    inputs: {
      type: Object,
      default: {},
    },
    outputs: {
      type: Object,
      default: {},
    },
    error: {
      type: Object,
      default: null, // { message, code, classification, step }
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    langGraphStatus: {
      type: String,
      enum: ['available', 'not-installed'],
      default: 'available',
    },
    confidenceScore: {
      type: Number,
      default: 1.0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Execution', executionSchema);

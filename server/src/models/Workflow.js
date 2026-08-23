const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a workflow name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'active',
    },
    triggerConfig: {
      type: {
        type: String,
        enum: ['manual', 'schedule', 'webhook', 'event'],
        default: 'manual',
      },
      scheduleCron: { type: String, default: '' },
      webhookPath: { type: String, default: '' },
      eventType: { type: String, default: '' },
      enabled: { type: Boolean, default: true },
    },
    nodes: {
      type: Array,
      default: [],
    },
    edges: {
      type: Array,
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    tags: {
      type: [String],
      default: ['general'],
    },
  },
  {
    timestamps: true,
  }
);

workflowSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Workflow', workflowSchema);

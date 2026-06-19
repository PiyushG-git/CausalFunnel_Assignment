const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: true,
      index: true,
    },
    event_type: {
      type: String,
      enum: ['page_view', 'click'],
      required: true,
    },
    page_url: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Click-specific fields (optional)
    x: {
      type: Number,
      default: null,
    },
    y: {
      type: Number,
      default: null,
    },
    // Viewport size for relative positioning
    viewport_width: {
      type: Number,
      default: null,
    },
    viewport_height: {
      type: Number,
      default: null,
    },
    // Extra metadata
    user_agent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: false, // we manage our own timestamp field
    versionKey: false,
  }
);

// Compound index for heatmap queries
eventSchema.index({ page_url: 1, event_type: 1 });
// Index for session timeline queries
eventSchema.index({ session_id: 1, timestamp: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;

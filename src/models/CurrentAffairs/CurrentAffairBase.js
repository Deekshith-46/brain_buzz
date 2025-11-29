const mongoose = require('mongoose');
const { Schema } = mongoose;

const currentAffairBaseSchema = new Schema(
  {
    contentType: {
      type: String,
      default: 'CURRENT_AFFAIRS',
      immutable: true,
    },
    date: {
      type: Date,
      required: true
    },
    categories: [{
      type: Schema.Types.ObjectId,
      ref: 'Category'
    }],
    subCategories: [{
      type: Schema.Types.ObjectId,
      ref: 'SubCategory'
    }],
    languages: [{
      type: Schema.Types.ObjectId,
      ref: 'Language'
    }],
    thumbnailUrl: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    fullContent: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    discriminatorKey: 'affairType',
    collection: 'currentaffairs' // Explicitly set collection name
  }
);

// Create a model that will be extended by specific types
const CurrentAffair = mongoose.model('CurrentAffair', currentAffairBaseSchema);

module.exports = CurrentAffair;

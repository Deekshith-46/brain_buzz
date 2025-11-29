const mongoose = require('mongoose');

const eBookSchema = new mongoose.Schema(
  {
    // For UI reference only
    contentType: {
      type: String,
      default: 'E_BOOK',
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
      },
    ],
    languages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Language',
      },
    ],
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    bookFileUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EBook', eBookSchema);

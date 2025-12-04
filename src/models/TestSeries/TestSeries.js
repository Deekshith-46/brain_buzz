const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const questionSchema = new mongoose.Schema(
  {
    questionNumber: {
      type: Number,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: [
      {
        type: String,
        trim: true,
      },
    ],
    correctOptionIndex: {
      type: Number,
    },
    explanation: {
      type: String,
      trim: true,
    },
    marks: {
      type: Number,
      default: 1,
    },
    negativeMarks: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
    },
    noOfQuestions: {
      type: Number,
    },
    questions: [questionSchema],
  },
  { _id: true }
);

const testSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    noOfQuestions: {
      type: Number,
    },
    totalMarks: {
      type: Number,
    },
    positiveMarks: {
      type: Number,
    },
    negativeMarks: {
      type: Number,
    },
    date: {
      type: Date,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    instructionsPage1: {
      type: String,
      trim: true,
    },
    instructionsPage2: {
      type: String,
      trim: true,
    },
    instructionsPage3: {
      type: String,
      trim: true,
    },
    totalExplanationVideoUrl: {
      type: String,
      trim: true,
    },
    sections: [sectionSchema],
  },
  { _id: true }
);

const testSeriesSchema = new Schema(
  {
    contentType: {
      type: String,
      default: 'TEST_SERIES',
      immutable: true,
    },
    date: {
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
    thumbnail: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    maxTests: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', null],
      default: null
    },
    value: {
      type: Number,
      min: 0,
      default: 0
    },
    validUntil: {
      type: Date,
      default: null
    }
  },
    tests: [testSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add a virtual for final price
testSeriesSchema.virtual('finalPrice').get(function() {
  if (!this.discount || !this.discount.type) return this.price;
  
  const now = new Date();
  if (this.discount.validUntil && new Date(this.discount.validUntil) < now) {
    return this.price; // Discount expired
  }
  
  let discountAmount = 0;
  if (this.discount.type === 'percentage') {
    discountAmount = (this.price * this.discount.value) / 100;
  } else {
    discountAmount = this.discount.value;
  }
  
  return Math.max(0, this.price - discountAmount);
});

// Ensure virtuals are included in toJSON output
testSeriesSchema.set('toJSON', { virtuals: true });
testSeriesSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('testSeries', testSeriesSchema, 'test_series');

const mongoose = require('mongoose');

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
    questionType: {
      type: String,
      enum: ['MCQ', 'SUBJECTIVE'],
      default: 'MCQ',
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
    questions: [questionSchema],
  },
  { _id: true }
);

const dailyQuizSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      default: 'DAILY_QUIZ',
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    month: {
      type: String,
      enum: [
        'JANUARY',
        'FEBRUARY',
        'MARCH',
        'APRIL',
        'MAY',
        'JUNE',
        'JULY',
        'AUGUST',
        'SEPTEMBER',
        'OCTOBER',
        'NOVEMBER',
        'DECEMBER',
      ],
      trim: true,
    },
    examDate: {
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
    totalMarks: {
      type: Number,
    },
    totalQuestions: {
      type: Number,
    },
    freeMockLinks: {
      type: String,
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
    sections: [sectionSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DailyQuiz', dailyQuizSchema);

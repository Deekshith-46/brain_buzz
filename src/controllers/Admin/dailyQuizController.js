const DailyQuiz = require('../../models/Quiz/DailyQuiz');

// Create Daily Quiz
exports.createDailyQuiz = async (req, res) => {
  try {
    if (!req.body.quiz) {
      return res
        .status(400)
        .json({ message: 'Quiz data (quiz) is required in JSON body' });
    }

    const {
      name,
      month,
      examDate,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      totalMarks,
      totalQuestions,
      freeMockLinks,
      instructions,
      sections = [],
      isActive,
    } = req.body.quiz;

    if (!name) {
      return res.status(400).json({ message: 'Quiz name is required' });
    }

    const quiz = await DailyQuiz.create({
      name,
      month,
      examDate,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      totalMarks,
      totalQuestions,
      freeMockLinks,
      instructions,
      sections,
      isActive,
    });

    return res.status(201).json({
      message: 'Daily Quiz created successfully',
      data: quiz,
    });
  } catch (error) {
    console.error('Error creating Daily Quiz:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all Daily Quizzes (admin)
exports.getDailyQuizzes = async (req, res) => {
  try {
    const { category, subCategory, language, month, isActive } = req.query;

    const filter = {};
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (month) filter.month = month;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const quizzes = await DailyQuiz.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(200).json({ data: quizzes });
  } catch (error) {
    console.error('Error fetching Daily Quizzes:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single quiz (admin)
exports.getDailyQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await DailyQuiz.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!quiz) {
      return res.status(404).json({ message: 'Daily Quiz not found' });
    }

    return res.status(200).json({ data: quiz });
  } catch (error) {
    console.error('Error fetching Daily Quiz:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Daily Quiz
exports.updateDailyQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.quiz) {
      return res
        .status(400)
        .json({ message: 'Quiz data (quiz) is required in JSON body' });
    }

    const {
      name,
      month,
      examDate,
      categoryIds,
      subCategoryIds,
      languageIds,
      totalMarks,
      totalQuestions,
      freeMockLinks,
      instructions,
      sections,
      isActive,
    } = req.body.quiz;

    const updates = {};

    if (name) updates.name = name;
    if (month) updates.month = month;
    if (examDate) updates.examDate = examDate;
    if (categoryIds) updates.categories = categoryIds;
    if (subCategoryIds) updates.subCategories = subCategoryIds;
    if (languageIds) updates.languages = languageIds;
    if (typeof totalMarks !== 'undefined') updates.totalMarks = totalMarks;
    if (typeof totalQuestions !== 'undefined') updates.totalQuestions = totalQuestions;
    if (typeof freeMockLinks !== 'undefined') updates.freeMockLinks = freeMockLinks;
    if (typeof instructions !== 'undefined') updates.instructions = instructions;
    if (Array.isArray(sections)) updates.sections = sections;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    const quiz = await DailyQuiz.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!quiz) {
      return res.status(404).json({ message: 'Daily Quiz not found' });
    }

    return res.status(200).json({
      message: 'Daily Quiz updated successfully',
      data: quiz,
    });
  } catch (error) {
    console.error('Error updating Daily Quiz:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Daily Quiz
exports.deleteDailyQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await DailyQuiz.findByIdAndDelete(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Daily Quiz not found' });
    }

    return res.status(200).json({ message: 'Daily Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting Daily Quiz:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

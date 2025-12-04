const TestSeries = require('../../models/TestSeries/TestSeries');
const cloudinary = require('../../config/cloudinary');

const uploadToCloudinary = (fileBuffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

// Create Test Series (basic info + maxTests)
exports.createTestSeries = async (req, res) => {
  try {
    const {
      date,
      categoryIds = [],
      subCategoryIds = [],
      name,
      maxTests,
      description,
      price = 0,
      discountType,
      discountValue,
      discountValidUntil
    } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: 'Test Series name is required' 
      });
    }

    if (typeof maxTests === 'undefined' || maxTests <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'maxTests (number of tests) must be greater than 0' 
      });
    }

    // Validate price
    if (price < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Price cannot be negative' 
      });
    }

    // Process and validate discount if provided
    let discountData = {
      type: null,
      value: 0,
      validUntil: null
    };

    // In createTestSeries function
if (discountType !== undefined && discountType !== '') {
  try {
    if (discountType === null || discountType === '') {
      // Keep default empty discount
    } else {
      if (!['percentage', 'fixed'].includes(discountType)) {
        throw new Error('Invalid discount type. Must be "percentage" or "fixed"');
      }
      
      // Ensure value is properly converted to a number
      const value = discountValue !== undefined ? Number(discountValue) : 0;
      if (isNaN(value) || value < 0) {
        throw new Error('Discount value must be a positive number');
      }

      if (discountType === 'percentage' && value > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }

      const validUntil = discountValidUntil ? new Date(discountValidUntil) : null;
      if (validUntil && validUntil < new Date()) {
        throw new Error('Discount expiry date must be in the future');
      }

      discountData = {
        type: discountType,
        value: value,  // This is now guaranteed to be a number
        validUntil: validUntil
      };
    }
  } catch (error) {
    return res.status(400).json({ 
      success: false,
      message: `Invalid discount: ${error.message}` 
    });
  }
}

    const thumbnail = req.file ? req.file.path : undefined;

    const series = await TestSeries.create({
      date,
      categories: Array.isArray(categoryIds) ? categoryIds : [categoryIds].filter(Boolean),
      subCategories: Array.isArray(subCategoryIds) ? subCategoryIds : [subCategoryIds].filter(Boolean),
      name,
      maxTests,
      description,
      thumbnail,
      price: Number(price),
      discount: discountData
    });

    return res.status(201).json({
      success: true,
      message: 'Test Series created successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error creating Test Series:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get full Test Series with all tests, sections, and questions (admin overview)
exports.getFullTestSeries = async (req, res) => {
  try {
    const { id } = req.params;

    const series = await TestSeries.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug');

    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    return res.status(200).json({ data: series });
  } catch (error) {
    console.error('Error fetching full Test Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single Test (with sections and questions) from a Test Series
exports.getTestInSeries = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    return res.status(200).json({ data: test });
  } catch (error) {
    console.error('Error fetching Test from Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all Test Series (admin)
exports.getTestSeriesList = async (req, res) => {
  try {
    const { category, subCategory, isActive, minPrice, maxPrice } = req.query;

    const filter = {};
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';
    
    // Add price range filtering if provided
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const seriesList = await TestSeries.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug');

    // Calculate final price for each series
    const now = new Date();
    const seriesWithFinalPrice = seriesList.map(series => {
      const seriesObj = series.toObject();
      let finalPrice = series.price;
      const discount = series.discount || {};

      if (discount.type && discount.value > 0) {
        const isDiscountValid = !discount.validUntil || new Date(discount.validUntil) > now;
        
        if (isDiscountValid) {
          if (discount.type === 'percentage') {
            finalPrice = series.price * (1 - (discount.value / 100));
          } else if (discount.type === 'fixed') {
            finalPrice = Math.max(0, series.price - discount.value);
          }
        }
      }

      seriesObj.finalPrice = finalPrice;
      return seriesObj;
    });

    return res.status(200).json({ 
      data: seriesWithFinalPrice 
    });
  } catch (error) {
    console.error('Error fetching Test Series list:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single Test Series
exports.getTestSeriesById = async (req, res) => {
  try {
    const { id } = req.params;

    const series = await TestSeries.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug');

    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    // Calculate final price based on discount
    let finalPrice = series.price;
    const discount = series.discount || {};
    
    if (discount.type && discount.value > 0) {
      const now = new Date();
      const isDiscountValid = !discount.validUntil || new Date(discount.validUntil) > now;
      
      if (isDiscountValid) {
        if (discount.type === 'percentage') {
          finalPrice = series.price * (1 - (discount.value / 100));
        } else if (discount.type === 'fixed') {
          finalPrice = Math.max(0, series.price - discount.value);
        }
      }
    }

    // Add finalPrice to the response
    const seriesData = series.toObject();
    seriesData.finalPrice = finalPrice;

    return res.status(200).json({ 
      data: seriesData 
    });
  } catch (error) {
    console.error('Error fetching Test Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Test Series basic details
exports.updateTestSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      categoryIds,
      subCategoryIds,
      name,
      maxTests,
      description,
      isActive,
      price,
      discountType,
      discountValue,
      discountValidUntil
    } = req.body;

    const updates = {};

    if (date) updates.date = date;
    if (categoryIds) updates.categories = Array.isArray(categoryIds) ? categoryIds : [categoryIds].filter(Boolean);
    if (subCategoryIds) updates.subCategories = Array.isArray(subCategoryIds) ? subCategoryIds : [subCategoryIds].filter(Boolean);
    if (name) updates.name = name;
    if (typeof maxTests !== 'undefined') updates.maxTests = maxTests;
    if (typeof description !== 'undefined') updates.description = description;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;
    
    // Handle price update
    if (typeof price !== 'undefined') {
      if (price < 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Price cannot be negative' 
        });
      }
      updates.price = Number(price);
    }

    // Process and validate discount if provided
    // In updateTestSeries function
if (discountType !== undefined) {
  try {
    // Handle case when discount should be removed
    if (discountType === '' || discountType === null) {
      updates.discount = {
        type: null,
        value: 0,
        validUntil: null
      };
    } else {
      // Validate discount type
      if (!['percentage', 'fixed'].includes(discountType)) {
        throw new Error('Invalid discount type. Must be "percentage" or "fixed"');
      }
      
      // Ensure value is properly converted to a number
      const value = discountValue !== undefined ? Number(discountValue) : 0;
      if (isNaN(value) || value < 0) {
        throw new Error('Discount value must be a positive number');
      }

      if (discountType === 'percentage' && value > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }

      // Parse and validate validUntil date
      const validUntil = discountValidUntil ? new Date(discountValidUntil) : null;
      if (validUntil && validUntil < new Date()) {
        throw new Error('Discount expiry date must be in the future');
      }

      updates.discount = {
        type: discountType,
        value: value,  // This is now guaranteed to be a number
        validUntil: validUntil
      };
    }
  } catch (error) {
    return res.status(400).json({ 
      success: false,
      message: `Invalid discount: ${error.message}` 
    });
  }
}

    if (req.file) {
      updates.thumbnail = req.file.path;
    }

    const series = await TestSeries.findByIdAndUpdate(
      id, 
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug');

    if (!series) {
      return res.status(404).json({ 
        success: false,
        message: 'Test Series not found' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Test Series updated successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error updating Test Series:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Delete Test Series
exports.deleteTestSeries = async (req, res) => {
  try {
    const { id } = req.params;

    const series = await TestSeries.findByIdAndDelete(id);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    return res.status(200).json({ message: 'Test Series deleted successfully' });
  } catch (error) {
    console.error('Error deleting Test Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a Test to a Test Series
exports.addTestToSeries = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const {
      testName,
      noOfQuestions,
      totalMarks,
      positiveMarks,
      negativeMarks,
      date,
      startTime,
      endTime,
    } = req.body;

    const series = await TestSeries.findById(seriesId);

    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    if (series.tests.length >= series.maxTests) {
      return res.status(400).json({
        message:
          'Cannot add more tests. You have reached the maximum number of tests for this series.',
      });
    }

    const newTest = {
      testName,
      noOfQuestions,
      totalMarks,
      positiveMarks,
      negativeMarks,
      date,
      startTime,
      endTime,
    };

    series.tests.push(newTest);
    await series.save();

    return res.status(201).json({
      message: 'Test added to series successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error adding Test to Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a Test inside a Test Series
exports.updateTestInSeries = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const updates = req.body || {};

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    Object.keys(updates).forEach((key) => {
      test[key] = updates[key];
    });

    await series.save();

    return res.status(200).json({
      message: 'Test updated successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error updating Test in Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a Test from a Test Series
exports.deleteTestFromSeries = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    test.remove();
    await series.save();

    return res.status(200).json({
      message: 'Test removed from series successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error deleting Test from Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Instructions for a Test
exports.updateTestInstructions = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { instructionsPage1, instructionsPage2, instructionsPage3 } = req.body;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    if (typeof instructionsPage1 !== 'undefined') {
      test.instructionsPage1 = instructionsPage1;
    }
    if (typeof instructionsPage2 !== 'undefined') {
      test.instructionsPage2 = instructionsPage2;
    }
    if (typeof instructionsPage3 !== 'undefined') {
      test.instructionsPage3 = instructionsPage3;
    }

    await series.save();

    return res.status(200).json({
      message: 'Test instructions updated successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error updating Test instructions:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add / Update Explanation Video for a Test
exports.updateTestExplanationVideo = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Explanation video file is required' });
    }

    // Upload video buffer to Cloudinary
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'brainbuzz/test-series/explanations',
      'video'
    );

    test.totalExplanationVideoUrl = uploadResult.secure_url;

    // Ensure Mongoose persists nested change
    series.markModified('tests');

    await series.save();

    return res.status(200).json({
      message: 'Test explanation video updated successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error updating Test explanation video:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add Section to a Test
exports.addSectionToTest = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { title, order, noOfQuestions } = req.body;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    const newSection = {
      title,
      order,
      noOfQuestions,
    };

    test.sections.push(newSection);
    await series.save();

    return res.status(201).json({
      message: 'Section added to test successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error adding Section to Test:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Section in a Test
exports.updateSectionInTest = async (req, res) => {
  try {
    const { seriesId, testId, sectionId } = req.params;
    const updates = req.body || {};

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    const section = test.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found in this test' });
    }

    Object.keys(updates).forEach((key) => {
      section[key] = updates[key];
    });

    await series.save();

    return res.status(200).json({
      message: 'Section updated successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error updating Section in Test:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Section from a Test
exports.deleteSectionFromTest = async (req, res) => {
  try {
    const { seriesId, testId, sectionId } = req.params;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    const section = test.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found in this test' });
    }

    section.remove();
    await series.save();

    return res.status(200).json({
      message: 'Section removed from test successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error deleting Section from Test:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add Question(s) to a Section
exports.addQuestionToSection = async (req, res) => {
  try {
    const { seriesId, testId, sectionId } = req.params;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    const section = test.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found in this test' });
    }

    // Support both single question payload and an array of questions
    let questionsPayload = [];

    if (Array.isArray(req.body.questions)) {
      questionsPayload = req.body.questions;
    } else {
      const {
        questionNumber,
        questionText,
        options = [],
        correctOptionIndex,
        explanation,
        marks,
        negativeMarks,
      } = req.body;

      if (!questionText) {
        return res
          .status(400)
          .json({ message: 'questionText is required when adding a question' });
      }

      questionsPayload = [
        {
          questionNumber,
          questionText,
          options,
          correctOptionIndex,
          explanation,
          marks,
          negativeMarks,
        },
      ];
    }

    // Enforce noOfQuestions limit for the section if set
    const currentCount = section.questions.length;
    const incomingCount = questionsPayload.length;

    if (
      typeof section.noOfQuestions === 'number' &&
      section.noOfQuestions > 0 &&
      currentCount + incomingCount > section.noOfQuestions
    ) {
      return res.status(400).json({
        message:
          'Cannot add questions: total questions would exceed the configured noOfQuestions for this section.',
        details: {
          noOfQuestions: section.noOfQuestions,
          currentCount,
          incomingCount,
        },
      });
    }

    questionsPayload.forEach((q) => {
      section.questions.push({
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        options: q.options || [],
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
      });
    });

    await series.save();

    return res.status(201).json({
      message: 'Question(s) added to section successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error adding Question to Section:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Question in a Section
exports.updateQuestionInSection = async (req, res) => {
  try {
    const { seriesId, testId, sectionId, questionId } = req.params;
    const updates = req.body || {};

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    const section = test.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found in this test' });
    }

    const question = section.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found in this section' });
    }

    Object.keys(updates).forEach((key) => {
      question[key] = updates[key];
    });

    await series.save();

    return res.status(200).json({
      message: 'Question updated successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error updating Question in Section:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Question from a Section
exports.deleteQuestionFromSection = async (req, res) => {
  try {
    const { seriesId, testId, sectionId, questionId } = req.params;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    const section = test.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found in this test' });
    }

    const question = section.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found in this section' });
    }

    question.remove();
    await series.save();

    return res.status(200).json({
      message: 'Question removed from section successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error deleting Question from Section:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

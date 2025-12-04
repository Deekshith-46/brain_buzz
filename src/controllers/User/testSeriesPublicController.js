// controllers/User/testSeriesPublicController.js
const TestSeries = require('../../models/TestSeries/TestSeries');
const TestSeriesPurchase = require('../../models/TestSeries/TestSeriesPurchase');
const User = require('../../models/User/User');
const { PurchaseService } = require('../../../services');


// Helper to check if user has access to a test series
const checkTestSeriesAccess = async (userId, seriesId) => {
  if (!userId) return false;
  
  const purchase = await TestSeriesPurchase.findOne({
    user: userId,
    testSeries: seriesId,
    status: 'completed',
    expiryDate: { $gt: new Date() }
  });

  return !!purchase;
};

// List all test series (public)
exports.listPublicTestSeries = async (req, res) => {
  try {
    const { category, subCategory } = req.query;
    const userId = req.user?._id;

    const filter = { isActive: true };
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;

    const seriesList = await TestSeries.find(filter)
      .select('name description thumbnail date maxTests tests categories subCategories')
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug');

    // For each series, check if user has access
    const seriesWithAccess = await Promise.all(seriesList.map(async (series) => {
      const hasAccess = userId ? await checkTestSeriesAccess(userId, series._id) : false;
      
      return {
        _id: series._id,
        name: series.name,
        description: series.description,
        thumbnail: series.thumbnail,
        date: series.date,
        maxTests: series.maxTests,
        testsCount: series.tests?.length || 0,
        categories: series.categories,
        subCategories: series.subCategories,
        hasAccess
      };
    }));

    return res.status(200).json({ 
      success: true,
      data: seriesWithAccess 
    });
  } catch (error) {
    console.error('Error listing public Test Series:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get test series details
exports.getPublicTestSeriesById = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const userId = req.user?._id;

    const series = await TestSeries.findOne({ _id: seriesId, isActive: true })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug');

    if (!series) {
      return res.status(404).json({ 
        success: false,
        message: 'Test Series not found' 
      });
    }

    const hasAccess = userId ? await checkTestSeriesAccess(userId, seriesId) : false;

    // Prepare test list without sensitive data
    const tests = series.tests.map(test => ({
      _id: test._id,
      testName: test.testName,
      noOfQuestions: test.questions?.length || 0,
      totalMarks: test.totalMarks,
      positiveMarks: test.positiveMarks,
      negativeMarks: test.negativeMarks,
      date: test.date,
      startTime: test.startTime,
      endTime: test.endTime,
      hasAccess // Include access status for each test
    }));

    return res.status(200).json({
      success: true,
      data: {
        _id: series._id,
        name: series.name,
        description: series.description,
        thumbnail: series.thumbnail,
        date: series.date,
        maxTests: series.maxTests,
        categories: series.categories,
        subCategories: series.subCategories,
        tests,
        hasAccess
      }
    });
  } catch (error) {
    console.error('Error fetching public Test Series details:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get test details (with access control for videos)
exports.getPublicTestInSeries = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const userId = req.user?._id;
    let hasAccess = false;

    // First, check if the test series exists
    const testSeries = await TestSeries.findOne({ 
      _id: seriesId, 
      isActive: true 
    }).lean();

    if (!testSeries) {
      return res.status(404).json({ 
        success: false,
        message: 'Test Series not found' 
      });
    }

    // Find the specific test in the series
    const test = testSeries.tests.find(t => t._id.toString() === testId);
    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found in this series' 
      });
    }

    // Check if user has access to this test series
    if (userId) {
      // Check if user has purchased the test series
      const user = await User.findById(userId).select('purchasedTestSeries');
      hasAccess = user.purchasedTestSeries.some(
        id => id.toString() === testSeries._id.toString()
      );
    }

    // Prepare basic test data (available to everyone)
    const testData = {
      _id: test._id,
      testName: test.testName,
      description: test.description,
      instructions: test.instructions,
      duration: test.duration,
      totalMarks: test.totalMarks,
      positiveMarks: test.positiveMarks,
      negativeMarks: test.negativeMarks,
      date: test.date,
      startTime: test.startTime,
      endTime: test.endTime,
      hasAccess
    };

    // Only include these fields if user has access
    if (hasAccess) {
      // Calculate total questions and sections
      let totalQuestions = 0;
      const sections = (test.sections || []).map(section => {
        const sectionQuestions = section.questions?.length || 0;
        totalQuestions += sectionQuestions;
        
        return {
          _id: section._id,
          title: section.title,
          order: section.order,
          noOfQuestions: sectionQuestions,
          marks: section.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0,
           questions: section.questions?.map(q => ({
            _id: q._id,
            questionNumber: q.questionNumber,
            questionText: q.questionText,
            options: q.options,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
          }))
        };
      });

      // Add protected fields
      Object.assign(testData, {
        totalQuestions,
        sections,
        totalExplanationVideoUrl: test.totalExplanationVideoUrl
      });

      // Include explanation videos if they exist
      if (test.explanationVideos) {
        testData.explanationVideos = test.explanationVideos;
      }
    } else {
      // For users without access, show section names only
      testData.sections = (test.sections || []).map(section => ({
        _id: section._id,
        title: section.title,
        noOfQuestions: section.questions?.length || 0
      }));
    }

    return res.status(200).json({
      success: true,
      data: testData
    });

  } catch (error) {
    console.error('Error fetching test details:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Public access version (no auth required)
exports.getPublicTestInSeriesPublic = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    // Find the test series
    const testSeries = await TestSeries.findOne({ 
      _id: seriesId, 
      isActive: true 
    }).lean();

    if (!testSeries) {
      return res.status(404).json({ 
        success: false,
        message: 'Test Series not found' 
      });
    }

    // Find the specific test in the series
    const test = testSeries.tests.find(t => t._id.toString() === testId);
    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found in this series' 
      });
    }

    // Prepare basic test data (no authentication required)
    const testData = {
      _id: test._id,
      testName: test.testName,
      totalMarks: test.totalMarks,
      positiveMarks: test.positiveMarks,
      negativeMarks: test.negativeMarks,
      date: test.date,
      startTime: test.startTime,
      endTime: test.endTime,
      hasAccess: false, // Always false for public access
      sections: (test.sections || []).map(section => ({
        _id: section._id,
        title: section.title,
        noOfQuestions: section.questions?.length || 0
      }))
    };

    return res.status(200).json({
      success: true,
      data: testData
    });

  } catch (error) {
    console.error('Error fetching public test details:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Add this new method
exports.initiatePurchase = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { couponCode } = req.body;
    const userId = req.user._id;

    // Check if already purchased
    const hasAccess = await PurchaseService.hasAccess(userId, 'test_series', seriesId);
    if (hasAccess) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased this test series'
      });
    }

    // Create purchase record
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const purchase = await PurchaseService.createPurchase(
      userId,
      [{ itemType: 'test_series', itemId: seriesId }],
      paymentId,
      couponCode
    );

    // In a real app, you would redirect to payment gateway here
    // For now, we'll return the payment details
    res.status(200).json({
      success: true,
      data: {
        paymentId: purchase.paymentId,
        amount: purchase.finalAmount,
        currency: 'INR', // Update as per your currency
        couponApplied: !!purchase.coupon,
        discountAmount: purchase.discountAmount
      }
    });
  } catch (error) {
    console.error('Error initiating purchase:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate purchase',
      error: error.message
    });
  }
};
const User = require('../models/User/User');

exports.checkTestAccess = async (req, res, next) => {
    try {
        const { testSeriesId } = req.params;
        const userId = req.user._id;

        const user = await User.findById(userId).select('purchasedTestSeries');
        
        // Check if user has purchased the test series
        const hasAccess = user.purchasedTestSeries.some(seriesId => 
            seriesId.toString() === testSeriesId
        );

        req.hasAccess = hasAccess;
        next();
    } catch (error) {
        console.error('Error checking test access:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking test access',
            error: error.message
        });
    }
};
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

require('./models/TestSeries/TestSeries');
require('./models/Order/Order');

const adminRoutes = require('./routes/Admin/adminRoutes');
const adminAuthRoutes = require('./routes/Admin/authRoutes');
const adminCategoryRoutes = require('./routes/Admin/categoryRoutes');
const adminSubCategoryRoutes = require('./routes/Admin/subCategoryRoutes');
const adminLanguageRoutes = require('./routes/Admin/languageRoutes');
const adminValidityRoutes = require('./routes/Admin/validityRoutes');
const adminCourseRoutes = require('./routes/Admin/courseRoutes');
const adminPublicationRoutes = require('./routes/Admin/publicationRoutes');
const adminEBookRoutes = require('./routes/Admin/eBookRoutes');
const adminDailyQuizRoutes = require('./routes/Admin/dailyQuizRoutes');
const adminCurrentAffairsRoutes = require('./routes/Admin/currentAffairsRoutes');
const adminTestSeriesRoutes = require('./routes/Admin/testSeriesRoutes');
const userRoutes = require('./routes/User/userRoutes');
const userAuthRoutes = require('./routes/User/authRoutes');
const userPublicationRoutes = require('./routes/User/publicationRoutes');
const userCourseRoutes = require('./routes/User/courseRoutes');
const userEBookRoutes = require('./routes/User/eBookRoutes');
const userDailyQuizRoutes = require('./routes/User/dailyQuizRoutes');
const currentAffairsRoutes = require('./routes/User/currentAffairsRoutes');
const userTestSeriesRoutes = require('./routes/User/testSeriesRoutes');
const adminOrderRoutes = require('./routes/Admin/orderRoutes');

const adminCouponRoutes = require('./routes/Admin/couponRoutes');
const userCouponRoutes = require('./routes/User/couponRoutes');

const paymentRoutes = require('./routes/User/paymentRoutes');
const orderRoutes = require('./routes/User/orderRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ message: 'Brain Buzz API is running' });
});

app.use('/api/admins', adminRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/subcategories', adminSubCategoryRoutes);
app.use('/api/admin/languages', adminLanguageRoutes);
app.use('/api/admin/validities', adminValidityRoutes);
app.use('/api/admin/courses', adminCourseRoutes);
app.use('/api/admin/publications', adminPublicationRoutes);
app.use('/api/admin/ebooks', adminEBookRoutes);
app.use('/api/admin/daily-quizzes', adminDailyQuizRoutes);
app.use('/api/admin/current-affairs', adminCurrentAffairsRoutes);
app.use('/api/admin/test-series', adminTestSeriesRoutes);
app.use('/api/v1/admin/coupons', adminCouponRoutes);
// And in your route middleware section, add:
app.use('/api/admin/orders', adminOrderRoutes);

app.use('/api/users', userRoutes);
app.use('/api/users', userAuthRoutes);
app.use('/api/users', userPublicationRoutes);
app.use('/api/users', userCourseRoutes);
app.use('/api/users', userEBookRoutes);
app.use('/api/users', userDailyQuizRoutes);
app.use('/api/v1', currentAffairsRoutes);
app.use('/api/v1/test-series', userTestSeriesRoutes);
// User routes
app.use('/api/v1/coupons', userCouponRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);

module.exports = app;

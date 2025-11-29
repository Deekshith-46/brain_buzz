const express = require('express');
const {
  createDailyQuiz,
  getDailyQuizzes,
  getDailyQuizById,
  updateDailyQuiz,
  deleteDailyQuiz,
} = require('../../controllers/Admin/dailyQuizController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.post('/', createDailyQuiz);
router.get('/', getDailyQuizzes);
router.get('/:id', getDailyQuizById);
router.put('/:id', updateDailyQuiz);
router.delete('/:id', deleteDailyQuiz);

module.exports = router;

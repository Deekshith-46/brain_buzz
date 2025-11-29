const express = require('express');
const router = express.Router();

const {
  createUser,
  getUsers,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
} = require('../../controllers/User/userController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

router.post('/', createUser);
router.get('/', getUsers);
router.get('/profile', userAuthMiddleware, getUserProfile);
router.put('/profile', userAuthMiddleware, updateUserProfile);
router.delete('/profile', userAuthMiddleware, deleteUserProfile);

module.exports = router;

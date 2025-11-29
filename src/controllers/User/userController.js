const User = require('../../models/User/User');
const bcrypt = require('bcryptjs');

// Create new user (registration via CRUD path)
exports.createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      selectGender,
      email,
      mobileNumber,
      dateOfBirth,
      state,
      address,
      password,
      isActive,
    } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingByMobile = await User.findOne({ mobileNumber });
    if (existingByMobile) {
      return res.status(400).json({ message: 'Mobile number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      selectGender,
      email,
      mobileNumber,
      dateOfBirth,
      state,
      address,
      password: hashedPassword,
      isActive,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(201).json({
      message: 'User created successfully',
      data: userObj,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return res.status(200).json({ data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user profile (from token)
exports.getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ data: user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update current user profile (from token)
exports.updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (updates.email) {
      const existingByEmail = await User.findOne({ email: updates.email, _id: { $ne: req.user._id } });
      if (existingByEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    if (updates.mobileNumber) {
      const existingByMobile = await User.findOne({ mobileNumber: updates.mobileNumber, _id: { $ne: req.user._id } });
      if (existingByMobile) {
        return res.status(400).json({ message: 'Mobile number already exists' });
      }
    }

    if (updates.password) {
      if (updates.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      message: 'User updated successfully',
      data: userObj,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete current user (hard delete)
exports.deleteUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByIdAndDelete(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const Category = require('../../models/Course/Category');
const cloudinary = require('../../config/cloudinary');

const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    stream.end(fileBuffer);
  });
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const slug = slugify(name);

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    let thumbnailUrl;
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/categories/thumbnails'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    const category = await Category.create({
      name,
      slug,
      description,
      isActive,
      thumbnailUrl,
    });

    return res.status(201).json({
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json({ data: category });
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const updates = { description, isActive };

    if (name) {
      const slug = slugify(name);
      const existing = await Category.findOne({ slug, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
      updates.name = name;
      updates.slug = slug;
    }

    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/categories/thumbnails'
      );
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    const category = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json({
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const EBook = require('../../models/EBook/EBook');
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

// Create E-Book
exports.createEBook = async (req, res) => {
  try {
    if (!req.body.ebook) {
      return res
        .status(400)
        .json({ message: 'E-Book data (ebook) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.ebook);

    const {
      name,
      startDate,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      description,
      isActive,
    } = parsed;

    if (!name) {
      return res.status(400).json({ message: 'E-Book name is required' });
    }

    // Thumbnail
    let thumbnailUrl;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(
        thumbFile.buffer,
        'brainbuzz/ebooks/thumbnails',
        'image'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    // Book file
    let bookFileUrl;
    if (req.files && req.files.bookFile && req.files.bookFile[0]) {
      const bookFile = req.files.bookFile[0];
      const uploadResult = await uploadToCloudinary(
        bookFile.buffer,
        'brainbuzz/ebooks/books',
        'raw'
      );
      bookFileUrl = uploadResult.secure_url;
    }

    const ebook = await EBook.create({
      name,
      startDate,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      thumbnailUrl,
      description,
      bookFileUrl,
      isActive,
    });

    return res.status(201).json({
      message: 'E-Book created successfully',
      data: ebook,
    });
  } catch (error) {
    console.error('Error creating E-Book:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: get all e-books
exports.getEBooks = async (req, res) => {
  try {
    const { category, subCategory, language, isActive } = req.query;

    const filter = {};
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const ebooks = await EBook.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(200).json({ data: ebooks });
  } catch (error) {
    console.error('Error fetching E-Books:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: get single e-book
exports.getEBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const ebook = await EBook.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!ebook) {
      return res.status(404).json({ message: 'E-Book not found' });
    }

    return res.status(200).json({ data: ebook });
  } catch (error) {
    console.error('Error fetching E-Book:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: update e-book
exports.updateEBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.ebook) {
      return res
        .status(400)
        .json({ message: 'E-Book data (ebook) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.ebook);

    const {
      name,
      startDate,
      categoryIds,
      subCategoryIds,
      languageIds,
      description,
      isActive,
    } = parsed;

    const updates = {};

    if (name) updates.name = name;
    if (startDate) updates.startDate = startDate;
    if (categoryIds) updates.categories = categoryIds;
    if (subCategoryIds) updates.subCategories = subCategoryIds;
    if (languageIds) updates.languages = languageIds;
    if (typeof description !== 'undefined') updates.description = description;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    // Thumbnail
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(
        thumbFile.buffer,
        'brainbuzz/ebooks/thumbnails',
        'image'
      );
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    // Book file
    if (req.files && req.files.bookFile && req.files.bookFile[0]) {
      const bookFile = req.files.bookFile[0];
      const uploadResult = await uploadToCloudinary(
        bookFile.buffer,
        'brainbuzz/ebooks/books',
        'raw'
      );
      updates.bookFileUrl = uploadResult.secure_url;
    }

    const ebook = await EBook.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!ebook) {
      return res.status(404).json({ message: 'E-Book not found' });
    }

    return res.status(200).json({
      message: 'E-Book updated successfully',
      data: ebook,
    });
  } catch (error) {
    console.error('Error updating E-Book:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: delete e-book
exports.deleteEBook = async (req, res) => {
  try {
    const { id } = req.params;

    const ebook = await EBook.findByIdAndDelete(id);
    if (!ebook) {
      return res.status(404).json({ message: 'E-Book not found' });
    }

    return res.status(200).json({ message: 'E-Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting E-Book:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

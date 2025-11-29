const Publication = require('../../models/Publication/Publication');
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

// Create a new publication
exports.createPublication = async (req, res) => {
  try {
    if (!req.body.publication) {
      return res
        .status(400)
        .json({ message: 'Publication data (publication) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.publication);

    const {
      name,
      startDate,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      validityIds = [],
      originalPrice,
      discountPrice,
      discountPercent,
      availableIn,
      pricingNote,
      shortDescription,
      detailedDescription,
      authors = [],
      isActive,
    } = parsed;

    if (!name) {
      return res.status(400).json({ message: 'Publication name is required' });
    }

    if (!originalPrice && originalPrice !== 0) {
      return res.status(400).json({ message: 'Original price is required' });
    }

    // Thumbnail
    let thumbnailUrl;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(
        thumbFile.buffer,
        'brainbuzz/publications/thumbnails',
        'image'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    // Authors images mapped by index
    const authorImages = (req.files && req.files.authorImages) || [];
    const finalAuthors = authors.map((author, index) => {
      const a = { ...author };
      if (authorImages[index]) {
        a._fileBuffer = authorImages[index].buffer;
      }
      return a;
    });

    for (const author of finalAuthors) {
      if (author._fileBuffer) {
        const uploadResult = await uploadToCloudinary(
          author._fileBuffer,
          'brainbuzz/publications/authors',
          'image'
        );
        author.photoUrl = uploadResult.secure_url;
        delete author._fileBuffer;
      }
    }

    // Extra gallery images
    const galleryImagesFiles = (req.files && req.files.galleryImages) || [];
    const galleryImages = [];
    for (const img of galleryImagesFiles) {
      const uploadResult = await uploadToCloudinary(
        img.buffer,
        'brainbuzz/publications/images',
        'image'
      );
      galleryImages.push(uploadResult.secure_url);
    }

    // Book file (pdf/doc)
    let bookFileUrl;
    if (req.files && req.files.bookFile && req.files.bookFile[0]) {
      const bookFile = req.files.bookFile[0];
      const uploadResult = await uploadToCloudinary(
        bookFile.buffer,
        'brainbuzz/publications/books',
        'raw'
      );
      bookFileUrl = uploadResult.secure_url;
    }

    const publication = await Publication.create({
      name,
      startDate,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      validities: validityIds,
      thumbnailUrl,
      originalPrice,
      discountPrice,
      discountPercent,
      availableIn,
      pricingNote,
      shortDescription,
      detailedDescription,
      authors: finalAuthors,
      galleryImages,
      bookFileUrl,
      isActive,
    });

    return res.status(201).json({
      message: 'Publication created successfully',
      data: publication,
    });
  } catch (error) {
    console.error('Error creating publication:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all publications (admin, with optional filters)
exports.getPublications = async (req, res) => {
  try {
    const { category, subCategory, language, isActive } = req.query;

    const filter = {};
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const publications = await Publication.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({ data: publications });
  } catch (error) {
    console.error('Error fetching publications:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single publication by ID
exports.getPublicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const publication = await Publication.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    return res.status(200).json({ data: publication });
  } catch (error) {
    console.error('Error fetching publication:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update publication
exports.updatePublication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.publication) {
      return res
        .status(400)
        .json({ message: 'Publication data (publication) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.publication);

    const {
      name,
      startDate,
      categoryIds,
      subCategoryIds,
      languageIds,
      validityIds,
      originalPrice,
      discountPrice,
      discountPercent,
      availableIn,
      pricingNote,
      shortDescription,
      detailedDescription,
      authors,
      isActive,
    } = parsed;

    const updates = {};

    if (name) updates.name = name;
    if (startDate) updates.startDate = startDate;
    if (categoryIds) updates.categories = categoryIds;
    if (subCategoryIds) updates.subCategories = subCategoryIds;
    if (languageIds) updates.languages = languageIds;
    if (validityIds) updates.validities = validityIds;
    if (typeof originalPrice !== 'undefined') updates.originalPrice = originalPrice;
    if (typeof discountPrice !== 'undefined') updates.discountPrice = discountPrice;
    if (typeof discountPercent !== 'undefined') updates.discountPercent = discountPercent;
    if (typeof availableIn !== 'undefined') updates.availableIn = availableIn;
    if (typeof pricingNote !== 'undefined') updates.pricingNote = pricingNote;
    if (typeof shortDescription !== 'undefined') updates.shortDescription = shortDescription;
    if (typeof detailedDescription !== 'undefined')
      updates.detailedDescription = detailedDescription;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    // Thumbnail
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(
        thumbFile.buffer,
        'brainbuzz/publications/thumbnails',
        'image'
      );
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    // Authors
    if (Array.isArray(authors)) {
      const authorImages = (req.files && req.files.authorImages) || [];
      const finalAuthors = authors.map((author, index) => {
        const a = { ...author };
        if (authorImages[index]) {
          a._fileBuffer = authorImages[index].buffer;
        }
        return a;
      });

      for (const author of finalAuthors) {
        if (author._fileBuffer) {
          const uploadResult = await uploadToCloudinary(
            author._fileBuffer,
            'brainbuzz/publications/authors',
            'image'
          );
          author.photoUrl = uploadResult.secure_url;
          delete author._fileBuffer;
        }
      }

      updates.authors = finalAuthors;
    }

    // Gallery images
    if (req.files && req.files.galleryImages && req.files.galleryImages.length > 0) {
      const galleryImagesFiles = req.files.galleryImages;
      const galleryImages = [];
      for (const img of galleryImagesFiles) {
        const uploadResult = await uploadToCloudinary(
          img.buffer,
          'brainbuzz/publications/images',
          'image'
        );
        galleryImages.push(uploadResult.secure_url);
      }
      updates.galleryImages = galleryImages;
    }

    // Book file
    if (req.files && req.files.bookFile && req.files.bookFile[0]) {
      const bookFile = req.files.bookFile[0];
      const uploadResult = await uploadToCloudinary(
        bookFile.buffer,
        'brainbuzz/publications/books',
        'raw'
      );
      updates.bookFileUrl = uploadResult.secure_url;
    }

    const publication = await Publication.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    return res.status(200).json({
      message: 'Publication updated successfully',
      data: publication,
    });
  } catch (error) {
    console.error('Error updating publication:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete publication
exports.deletePublication = async (req, res) => {
  try {
    const { id } = req.params;

    const publication = await Publication.findByIdAndDelete(id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    return res.status(200).json({ message: 'Publication deleted successfully' });
  } catch (error) {
    console.error('Error deleting publication:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

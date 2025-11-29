const Course = require('../../models/Course/Course');
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

// Create new course (ONLINE_COURSE) with thumbnail + tutor images
exports.createCourse = async (req, res) => {
  try {
    if (!req.body.course) {
      return res.status(400).json({ message: 'Course data (course) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.course);

    const {
      contentType = 'ONLINE_COURSE',
      name,
      courseType,
      startDate,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      validityIds = [],
      originalPrice,
      discountPrice,
      discountPercent,
      pricingNote,
      shortDescription,
      detailedDescription,
      tutors = [],
      classes = [],
      studyMaterials = [],
      isActive,
    } = parsed;

    if (!name) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    if (!originalPrice && originalPrice !== 0) {
      return res.status(400).json({ message: 'Original price is required' });
    }

    // Handle thumbnail upload
    let thumbnailUrl;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(
        thumbFile.buffer,
        'brainbuzz/courses/thumbnails',
        'image'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    // Handle tutor images (match by index)
    const tutorImages = (req.files && req.files.tutorImages) || [];
    const finalTutors = tutors.map((tutor, index) => {
      const t = { ...tutor };
      if (tutorImages[index]) {
        t._fileBuffer = tutorImages[index].buffer;
      }
      return t;
    });

    // Upload tutor images to Cloudinary
    for (const tutor of finalTutors) {
      if (tutor._fileBuffer) {
        const uploadResult = await uploadToCloudinary(
          tutor._fileBuffer,
          'brainbuzz/courses/tutors',
          'image'
        );
        tutor.photoUrl = uploadResult.secure_url;
        delete tutor._fileBuffer;
      }
    }

    // Handle class media (thumbnails, lecture pics, videos) matched by index
    const classThumbnails = (req.files && req.files.classThumbnails) || [];
    const classLecturePics = (req.files && req.files.classLecturePics) || [];
    const classVideos = (req.files && req.files.classVideos) || [];

    const finalClasses = classes.map((cls, index) => {
      const c = { ...cls };
      if (classThumbnails[index]) {
        c._thumbBuffer = classThumbnails[index].buffer;
      }
      if (classLecturePics[index]) {
        c._lectureBuffer = classLecturePics[index].buffer;
      }
      if (classVideos[index]) {
        c._videoBuffer = classVideos[index].buffer;
      }
      return c;
    });

    for (const cls of finalClasses) {
      if (cls._thumbBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._thumbBuffer,
          'brainbuzz/courses/classes/thumbnails',
          'image'
        );
        cls.thumbnailUrl = uploadResult.secure_url;
        delete cls._thumbBuffer;
      }
      if (cls._lectureBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._lectureBuffer,
          'brainbuzz/courses/classes/lectures',
          'image'
        );
        cls.lecturePhotoUrl = uploadResult.secure_url;
        delete cls._lectureBuffer;
      }
      if (cls._videoBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._videoBuffer,
          'brainbuzz/courses/classes/videos',
          'video'
        );
        cls.videoUrl = uploadResult.secure_url;
        delete cls._videoBuffer;
      }
    }

    // Handle study material files matched by index
    const studyFiles = (req.files && req.files.studyMaterialFiles) || [];
    const finalStudyMaterials = studyMaterials.map((sm, index) => {
      const s = { ...sm };
      if (studyFiles[index]) {
        s._fileBuffer = studyFiles[index].buffer;
      }
      return s;
    });

    for (const sm of finalStudyMaterials) {
      if (sm._fileBuffer) {
        const uploadResult = await uploadToCloudinary(
          sm._fileBuffer,
          'brainbuzz/courses/study-materials',
          'raw'
        );
        sm.fileUrl = uploadResult.secure_url;
        delete sm._fileBuffer;
      }
    }

    const course = await Course.create({
      contentType,
      name,
      courseType,
      startDate,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      validities: validityIds,
      thumbnailUrl,
      originalPrice,
      discountPrice,
      discountPercent,
      pricingNote,
      shortDescription,
      detailedDescription,
      tutors: finalTutors,
      classes: finalClasses,
      studyMaterials: finalStudyMaterials,
      isActive,
    });

    return res.status(201).json({
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all courses (optionally filtered)
exports.getCourses = async (req, res) => {
  try {
    const { contentType, category, subCategory, language, isActive } = req.query;

    const filter = {};
    if (contentType) filter.contentType = contentType;
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const courses = await Course.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({ data: courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({ data: course });
  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update course (supports replacing thumbnail and tutor images)
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.course) {
      return res.status(400).json({ message: 'Course data (course) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.course);

    const {
      contentType,
      name,
      courseType,
      startDate,
      categoryIds,
      subCategoryIds,
      languageIds,
      validityIds,
      originalPrice,
      discountPrice,
      discountPercent,
      pricingNote,
      shortDescription,
      detailedDescription,
      tutors,
      classes,
      studyMaterials,
      isActive,
    } = parsed;

    const updates = {};

    if (contentType) updates.contentType = contentType;
    if (name) updates.name = name;
    if (courseType) updates.courseType = courseType;
    if (startDate) updates.startDate = startDate;
    if (categoryIds) updates.categories = categoryIds;
    if (subCategoryIds) updates.subCategories = subCategoryIds;
    if (languageIds) updates.languages = languageIds;
    if (validityIds) updates.validities = validityIds;
    if (typeof originalPrice !== 'undefined') updates.originalPrice = originalPrice;
    if (typeof discountPrice !== 'undefined') updates.discountPrice = discountPrice;
    if (typeof discountPercent !== 'undefined') updates.discountPercent = discountPercent;
    if (typeof pricingNote !== 'undefined') updates.pricingNote = pricingNote;
    if (typeof shortDescription !== 'undefined') updates.shortDescription = shortDescription;
    if (typeof detailedDescription !== 'undefined') updates.detailedDescription = detailedDescription;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    // Handle thumbnail upload
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(thumbFile.buffer, 'brainbuzz/courses/thumbnails');
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    // Handle tutor images
    if (Array.isArray(tutors)) {
      const tutorImages = (req.files && req.files.tutorImages) || [];
      const finalTutors = tutors.map((tutor, index) => {
        const t = { ...tutor };
        if (tutorImages[index]) {
          t._fileBuffer = tutorImages[index].buffer;
        }
        return t;
      });

      for (const tutor of finalTutors) {
        if (tutor._fileBuffer) {
          const uploadResult = await uploadToCloudinary(
            tutor._fileBuffer,
            'brainbuzz/courses/tutors',
            'image'
          );
          tutor.photoUrl = uploadResult.secure_url;
          delete tutor._fileBuffer;
        }
      }

      updates.tutors = finalTutors;
    }

    // Handle classes media
    if (Array.isArray(classes)) {
      const classThumbnails = (req.files && req.files.classThumbnails) || [];
      const classLecturePics = (req.files && req.files.classLecturePics) || [];
      const classVideos = (req.files && req.files.classVideos) || [];

      const finalClasses = classes.map((cls, index) => {
        const c = { ...cls };
        if (classThumbnails[index]) {
          c._thumbBuffer = classThumbnails[index].buffer;
        }
        if (classLecturePics[index]) {
          c._lectureBuffer = classLecturePics[index].buffer;
        }
        if (classVideos[index]) {
          c._videoBuffer = classVideos[index].buffer;
        }
        return c;
      });

      for (const cls of finalClasses) {
        if (cls._thumbBuffer) {
          const uploadResult = await uploadToCloudinary(
            cls._thumbBuffer,
            'brainbuzz/courses/classes/thumbnails',
            'image'
          );
          cls.thumbnailUrl = uploadResult.secure_url;
          delete cls._thumbBuffer;
        }
        if (cls._lectureBuffer) {
          const uploadResult = await uploadToCloudinary(
            cls._lectureBuffer,
            'brainbuzz/courses/classes/lectures',
            'image'
          );
          cls.lecturePhotoUrl = uploadResult.secure_url;
          delete cls._lectureBuffer;
        }
        if (cls._videoBuffer) {
          const uploadResult = await uploadToCloudinary(
            cls._videoBuffer,
            'brainbuzz/courses/classes/videos',
            'video'
          );
          cls.videoUrl = uploadResult.secure_url;
          delete cls._videoBuffer;
        }
      }

      updates.classes = finalClasses;
    }

    // Handle study materials
    if (Array.isArray(studyMaterials)) {
      const studyFiles = (req.files && req.files.studyMaterialFiles) || [];

      const finalStudyMaterials = studyMaterials.map((sm, index) => {
        const s = { ...sm };
        if (studyFiles[index]) {
          s._fileBuffer = studyFiles[index].buffer;
        }
        return s;
      });

      for (const sm of finalStudyMaterials) {
        if (sm._fileBuffer) {
          const uploadResult = await uploadToCloudinary(
            sm._fileBuffer,
            'brainbuzz/courses/study-materials',
            'raw'
          );
          sm.fileUrl = uploadResult.secure_url;
          delete sm._fileBuffer;
        }
      }

      updates.studyMaterials = finalStudyMaterials;
    }

    const course = await Course.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete course (hard delete)
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

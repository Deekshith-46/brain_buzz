const Course = require('../../models/Course/Course');

// Public: list courses (primarily ONLINE_COURSE) with optional filters
exports.listCourses = async (req, res) => {
  try {
    const { contentType, category, subCategory, language } = req.query;

    const filter = {
      isActive: true,
    };

    // default to ONLINE_COURSE when not provided
    filter.contentType = contentType || 'ONLINE_COURSE';

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;

    const courses = await Course.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({ data: courses });
  } catch (error) {
    console.error('Error listing courses:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public: get single course by id
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findOne({
      _id: id,
      isActive: true,
    })
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

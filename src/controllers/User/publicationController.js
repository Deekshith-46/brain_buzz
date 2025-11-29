const Publication = require('../../models/Publication/Publication');

// Public: list publications with optional filters
exports.listPublications = async (req, res) => {
  try {
    const { category, subCategory, language } = req.query;

    const filter = {
      isActive: true,
    };

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;

    const publications = await Publication.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({ data: publications });
  } catch (error) {
    console.error('Error listing publications:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public: get single publication by id
exports.getPublicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const publication = await Publication.findOne({
      _id: id,
      isActive: true,
    })
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

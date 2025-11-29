const CurrentAffair = require('../../models/CurrentAffairs/CurrentAffairBase');

// Public: list all current affairs
exports.listCurrentAffairs = async (req, res) => {
  try {
    const { category, subCategory, language, date, affairType } = req.query;

    const filter = {
      isActive: true,
    };

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (date) filter.date = date;
    if (affairType) filter.affairType = affairType;

    const docs = await CurrentAffair.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .sort({ createdAt: -1 });

    const grouped = {
      latest: [],
      monthly: [],
      sports: [],
      state: [],
      international: [],
      politics: [],
      local: [],
    };

    docs.forEach((affair) => {
      switch (affair.affairType) {
        case 'LatestCurrentAffair':
          grouped.latest.push(affair);
          break;
        case 'MonthlyCurrentAffair':
          grouped.monthly.push(affair);
          break;
        case 'SportsCurrentAffair':
          grouped.sports.push(affair);
          break;
        case 'StateCurrentAffair':
          grouped.state.push(affair);
          break;
        case 'InternationalCurrentAffair':
          grouped.international.push(affair);
          break;
        case 'PoliticsCurrentAffair':
          grouped.politics.push(affair);
          break;
        case 'LocalCurrentAffair':
          grouped.local.push(affair);
          break;
        default:
          break;
      }
    });

    return res.status(200).json({ data: grouped });
  } catch (error) {
    console.error('Error listing current affairs:', error);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

// Public: get single current affair by id
exports.getCurrentAffairById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await CurrentAffair.findOne({
      _id: id,
      isActive: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!doc) {
      return res.status(404).json({ message: 'Current affair not found' });
    }

    return res.status(200).json({ data: doc });
  } catch (error) {
    console.error('Error fetching current affair:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

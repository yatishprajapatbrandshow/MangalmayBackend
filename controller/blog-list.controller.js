const Slug = require('../models/slug.model');

exports.getAll = async (req, res) => {
  try {
    const { type, category, tag } = req.query;

    if (!type && !category && !tag) {
      return res.status(400).json({
        status: false,
        message: "Please provide type, category, or tag to filter",
        data: false
      });
    }

    // Build dynamic filter
    const filter = {
        status:true,
        deleteflag:false
    };
    if (type) filter.type = type;
    if (category) filter.categorys = { $elemMatch: { slug: category } };
    if (tag) filter.tags = { $elemMatch: { slug: tag } };
    
    // Sort by latest date first (assuming createdAt field exists)
    const pages = await Slug.find(filter).sort({ post_date_gmt: -1 });

    return res.json({
      status: true,
      message: "Pages fetched successfully",
      data: pages
    });

  } catch (error) {
    console.error("Error fetching pages:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: false
    });
  }
};

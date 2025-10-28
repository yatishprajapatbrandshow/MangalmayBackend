const Slug = require('../models/slug.model');

exports.getAll = async (req, res) => {
  try {
    const { type, category, tag, querySearch, page = 1, limit = 10 } = req.query;

    // ✅ Allow querySearch as a valid filter option
    if (!type && !category && !tag && !querySearch) {
      return res.status(400).json({
        status: false,
        message: "Please provide type, category, tag, or querySearch to filter",
        data: false,
      });
    }

    // 🧩 Build dynamic filter
    const filter = {
      status: true,
      deleteflag: false,
    };

    // Add filters based on query parameters
    if (type) filter.type = type;
    if (category) filter.categorys = { $elemMatch: { slug: category } };
    if (tag) filter.tags = { $elemMatch: { slug: tag } };

    // ✅ Add case-insensitive regex search (name + description)
    if (querySearch && querySearch.trim() !== "") {
      const regex = new RegExp(querySearch, "i");
      filter.$or = [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
      ];
    }

    // Convert pagination values to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch paginated data + total count
    const [pages, totalCount] = await Promise.all([
      Slug.find(filter)
        .sort({ post_date_gmt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Slug.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    return res.json({
      status: true,
      message: "Pages fetched successfully",
      data: {
        pages,
        pagination: {
          totalItems: totalCount,
          totalPages,
          currentPage: pageNumber,
          limit: limitNumber,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: false,
    });
  }
};


exports.getUniqueCategories = async (req, res) => {
  try {
    // Fetch only the categorys field from BlogDetails type
    const blogs = await Slug.find(
      { type: "BlogDetails", status: true, deleteflag: false },
      { categorys: 1, _id: 0 }
    );

    // Extract all categories
    const allCategories = blogs.flatMap(blog => blog.categorys || []);

    // Deduplicate based on slug
    const uniqueCategories = [];
    const seenSlugs = new Set();

    allCategories.forEach(cat => {
      if (cat?.slug && !seenSlugs.has(cat.slug)) {
        seenSlugs.add(cat.slug);
        uniqueCategories.push({
          name: cat.name || "Unnamed Category",
          slug: cat.slug,
        });
      }
    });

    return res.json({
      status: true,
      message: "Unique categories fetched successfully",
      data: uniqueCategories.length ? uniqueCategories : false,
    });

  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: false,
    });
  }
};

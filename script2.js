const mongoose = require("mongoose");
const Slug = require("./models/slug.model"); // adjust path as needed

// MongoDB connection
mongoose.connect("mongodb+srv://brandshow:xS36OgTIDikH3V4Q@cluster0.k22pflm.mongodb.net/MIMT?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addTrailingSlashToBlogDetailsPath() {
  try {
    console.log("Checking BlogDetails paths...");

    // Find all BlogDetails where path does NOT end with '/'
    const slugsToFix = await Slug.find({
      type: "BlogDetails",
      path: { $not: /\/$/ }, // path not ending with /
    });

    if (!slugsToFix.length) {
      console.log("✅ All BlogDetails paths already end with '/'");
      return;
    }

    console.log(`Found ${slugsToFix.length} paths to fix...`);

    // Update each path
    for (const doc of slugsToFix) {
      const cleanPath = doc.path.trim();

      // Add trailing slash if not exists
      const newPath = cleanPath.endsWith("/") ? cleanPath : cleanPath + "/";

      await Slug.updateOne({ _id: doc._id }, { $set: { path: newPath } });
      console.log(`🔧 Updated: ${doc.path} → ${newPath}`);
    }

    console.log("🎉 All paths updated successfully!");
  } catch (error) {
    console.error("❌ Error updating paths:", error);
  } finally {
    mongoose.connection.close();
  }
}

addTrailingSlashToBlogDetailsPath();

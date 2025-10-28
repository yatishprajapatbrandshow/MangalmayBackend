const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const Slug = require('./slug.model'); // your Slug schema

// ----------------- 1. MongoDB Connect -----------------
mongoose.connect('mongodb+srv://brandshow:xS36OgTIDikH3V4Q@cluster0.k22pflm.mongodb.net/MIMT?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ----------------- 2. MySQL Connect -----------------
async function getGalleryData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root@123',
    database: 'Mangalmay'
  });

  const [rows] = await connection.execute('SELECT * FROM tbl_gallery');
  await connection.end();
  return rows;
}

// ----------------- 3. Helper: Prepare Mongo Data -----------------
function generateRandomPageId() {
  // Generates a random unique number based on timestamp + random digits
  return Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
}

function prepareSlugFromGallery(item) {
  // ✅ Generate safe slug
  const slugText = (item.title || `gallery-${item?.id}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // ✅ Parse date safely
  let parsedDate = null;
  if (item.date && !isNaN(Date.parse(item.date))) {
    parsedDate = new Date(item.date);
  } else {
    parsedDate = new Date(item.addedon || Date.now());
  }

  // ✅ Prepare gallery images
  const galleryImages = item.download
    ? item.download
        .split(',')
        .map((img) => img.trim())
        .filter((img) => img !== '')
    : [];
const pgId=generateRandomPageId()
  return {
    page_id: pgId, // ✅ random unique id
    parent_id: 0,
    clg_id: 0,
    languageId: 1,
    price: 0,

    // Main info
    name: item.title || `Gallery ${item?.id}`,
    shortdesc: '',
    description: '',
    banner_img: galleryImages.length > 0 ? galleryImages[0] : '',
    galleryimg: galleryImages,
    slug: slugText,
    path: `/gallery/${item?.galleryurl}`,
    id_path: `/${pgId}`,
    old_url: item.galleryurl || '',

    // SEO
    metatitle: item.meta_title || '',
    metadesc: item.meta_des || '',
    keywords_tag: item.onpage_seo || '',

    // Extra fields
    date: parsedDate,
    type: "Gallery",
    status: item.status == 1,
    deleteflag: item.delete_flag == 1,
    addedon: item.addedon ? new Date(item.addedon) : new Date(),
    addedby: "Gallery Migration",
  };
}

// ----------------- 4. Migration Function -----------------
async function migrateGallery() {
  const failedMigrations = [];
  let successCount = 0;

  try {
    const galleryData = await getGalleryData();
    console.log(`📦 Found ${galleryData.length} rows in gallery`);

    for (const item of galleryData) {
      try {
        const slugDoc = new Slug(prepareSlugFromGallery(item));
        await slugDoc.save();
        successCount++;
        console.log(`✅ Migrated Gallery ID: ${item?.id} -> ${slugDoc.slug}`);
      } catch (err) {
        failedMigrations.push({ id: item?.id, error: err.message });
        console.error(`❌ Error migrating Gallery ID ${item?.id}: ${err.message}`);
      }
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Total Rows: ${galleryData.length}`);
    console.log(`✅ Successfully Migrated: ${successCount}`);
    console.log(`❌ Failed Migrations: ${failedMigrations.length}`);
    if (failedMigrations.length > 0) console.log('Failed IDs:', failedMigrations.map(f => f.id).join(', '));

    mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err.message);
    mongoose.disconnect();
  }
}

// ----------------- 5. Run Migration -----------------
migrateGallery();

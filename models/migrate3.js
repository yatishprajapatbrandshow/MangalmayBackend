const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const Slug = require('./slug.model'); // MongoDB Schema

// ----------------- 1. MongoDB Connect -----------------
mongoose.connect(
  'mongodb+srv://brandshow:xS36OgTIDikH3V4Q@cluster0.k22pflm.mongodb.net/MIMT?retryWrites=true&w=majority',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ----------------- 2. MySQL Connect -----------------
async function getNewsData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root@123',
    database: 'Mangalmay',
  });

  const [rows] = await connection.execute('SELECT * FROM tbl_latest_news');
  await connection.end();
  return rows;
}

// ----------------- 3. Helper: Get Next Auto Page ID -----------------
async function getNextPageId() {
  const lastDoc = await Slug.findOne().sort({ page_id: -1 }).lean();
  return lastDoc ? lastDoc.page_id + 1 : 1; // start from 1 if no data exists
}

// ----------------- 4. Helper: Prepare Mongo Data -----------------
async function prepareSlugFromNews(item) {
  const nextPageId = await getNextPageId();

  // Generate SEO-friendly slug
  let slugText = (item.title || `event-${nextPageId}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Date validation
  let parsedDate = null;
  if (item.date && !isNaN(Date.parse(item.date))) {
    parsedDate = new Date(item.date);
  } else {
    parsedDate = new Date(); // fallback
  }

  return {
    page_id: nextPageId,
    parent_id: 0,
    clg_id: 0,
    languageId: 1,
    price: 0,
    name: item.title || `Event ${nextPageId}`,
    shortdesc: item.sdescription || '',
    description: item.description || '',
    banner_img: item.images ? item.images.split(',')[0] : '',
    galleryimg: item.images ? item.images.split(',') : [],
    slug: slugText,
    path: `/events/${item.newsurl}.html`,
    id_path: `/${nextPageId}`,
    old_url: item.newsurl || null,
    type: 'Event',

    // SEO fields
    metatitle: item.meta_title || '',
    metadesc: item.meta_des || '',
    keywords_tag: item.onpage_seo || '',

    // Additional info
    location: item.location || '',
    date: parsedDate,
    featured: !!item.featured,
    status: item.status === 1 || item.status === 'active' || item.status === true,
    deleteflag: !!item.deleteflag,
    addedon: item.addedon ? new Date(item.addedon) : new Date(),
    addedby: 'Event Migration',
  };
}

// ----------------- 5. Migration Function -----------------
async function migrateNewsfeed() {
  const failedMigrations = [];
  let successCount = 0;

  try {
    const newsData = await getNewsData();
    console.log(`📦 Found ${newsData.length} rows in newsfeed`);

    for (const item of newsData) {
      try {
        const preparedData = await prepareSlugFromNews(item);
        const slugDoc = new Slug(preparedData);
        await slugDoc.save();
        successCount++;
        console.log(`✅ Migrated Event -> ${slugDoc.slug} (page_id: ${preparedData.page_id})`);
      } catch (err) {
        failedMigrations.push({ title: item.title, error: err.message });
        console.error(`❌ Error migrating "${item.title}": ${err.message}`);
      }
    }

    console.log('\n--- 🧾 Migration Summary ---');
    console.log(`Total Rows: ${newsData.length}`);
    console.log(`✅ Successfully Migrated: ${successCount}`);
    console.log(`❌ Failed Migrations: ${failedMigrations.length}`);
    if (failedMigrations.length > 0)
      console.log('Failed Titles:', failedMigrations.map(f => f.title).join(', '));

    mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err.message);
    mongoose.disconnect();
  }
}

// ----------------- 6. Run Migration -----------------
migrateNewsfeed();

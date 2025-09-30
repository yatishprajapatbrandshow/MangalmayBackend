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
async function getNewsfeedData() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'mangalmayseconddb'
    });

    const [rows] = await connection.execute('SELECT * FROM newsfeed');
    await connection.end();
    return rows;
}

// ----------------- 3. Helper: Prepare Mongo Data -----------------
function prepareSlugFromNews(item) {
    // Generate slug safely
    let slugText = (item.news_title || `news-${item?.newsfeed_id}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // ✅ Date handling (fix invalid date issue)
    let parsedDate = null;
    if (item.news_date && !isNaN(Date.parse(item.news_date))) {
        parsedDate = new Date(item.news_date);
    } else {
        parsedDate = new Date(); // fallback to current date
    }

    return {
        page_id: Number(item?.newsfeed_id),
        parent_id: 0,
        clg_id: 0,
        languageId: 1,
        price: 0,
        name: item.news_title || `News ${item?.newsfeed_id}`,
        shortdesc: item.news_headline || '',
        description: item.description || '',
        banner_img: item.image || '',
        galleryimg: item.image ? item.image.split(',') : [],
        slug: slugText,
        path: `/news/${slugText}`,
        id_path: `/${item?.newsfeed_id}`,
        old_url: item.newsurl || null,
        type:'News',
        // SEO fields
        metatitle: item.meta_title || '',
        metadesc: item.meta_description || '',
        keywords_tag: item.meta_keyword || '',
        tag1: null,
        tag2: null,
        tag3: null,

        // Additional info
        date: parsedDate,
        status: item.status === 'active',
        deleteflag: item.deleteflag ? Boolean(item.deleteflag) : false,
        addedon: new Date(),
        addedby: "Newsfeed Migration",
    };
}

// ----------------- 4. Migration Function -----------------
async function migrateNewsfeed() {
    const failedMigrations = [];
    let successCount = 0;

    try {
        const newsData = await getNewsfeedData();
        console.log(`📦 Found ${newsData.length} rows in newsfeed`);

        for (const item of newsData) {
            try {
                const slugDoc = new Slug(prepareSlugFromNews(item));
                await slugDoc.save();
                successCount++;
                console.log(`✅ Migrated News ID: ${item?.newsfeed_id} -> ${slugDoc.slug}`);
            } catch (err) {
                failedMigrations.push({ id: item?.newsfeed_id, error: err.message });
                console.error(`❌ Error migrating News ID ${item?.newsfeed_id}: ${err.message}`);
            }
        }

        console.log('\n--- Migration Summary ---');
        console.log(`Total Rows: ${newsData.length}`);
        console.log(`Successfully Migrated: ${successCount}`);
        console.log(`Failed Migrations: ${failedMigrations.length}`);
        if (failedMigrations.length > 0) console.log('Failed IDs:', failedMigrations.map(f => f.id).join(', '));

        mongoose.disconnect();
    } catch (err) {
        console.error('Migration failed:', err.message);
        mongoose.disconnect();
    }
}

// ----------------- 5. Run Migration -----------------
migrateNewsfeed();

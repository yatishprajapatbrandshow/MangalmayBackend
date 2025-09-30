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
async function getJobPostedData() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'mangalmayseconddb'
    });

    const [rows] = await connection.execute('SELECT * FROM job_posted');
    await connection.end();
    return rows;
}

// ----------------- 3. Helper: Prepare Mongo Data -----------------
function prepareSlugFromJob(item) {
    // ✅ Generate safe slug
    let slugText = (item.job_title || `job-${item?.jobposted_id}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // ✅ Date safe parser
    let parsedDate = null;
    if (item.date && !isNaN(Date.parse(item.date))) {
        parsedDate = new Date(item.date);
    } else {
        parsedDate = new Date();
    }

    return {
        page_id: Number(item?.jobposted_id),
        parent_id: 0,
        clg_id: 0,
        languageId: 1,
        price: 0,

        // Main info
        name: item.job_title || `Job ${item?.jobposted_id}`,
        shortdesc: item.comp_name || '',
        description: item.description || '',
        banner_img: item.image || '',
        galleryimg: item.image ? item.image.split(',') : [],
        slug: slugText,
        path: `/jobs/${slugText}`,
        id_path: `/${item?.jobposted_id}`,
        old_url: item.url || null,

        // SEO
        metatitle: item.meta_title || '',
        metadesc: item.meta_description || '',
        keywords_tag: item.meta_keyword || '',

        // Job-specific info mapped into params
        param1: item.comp_name || '',
        paramvalue1: item.comp_website || '',
        param2: item.comp_description || '',
        paramvalue2: item.jobfair_address || '',
        param3: item.designation || '',
        paramvalue3: item.experience || '',
        param4: item.location || '',
        paramvalue4: item.package || '',
        param5: item.campusurl || '',

        // Extra
        date: parsedDate,
        type: "JobPosted",
        status: item.status === 'active',
        deleteflag: item.deleteflag ? Boolean(item.deleteflag) : false,
        addedon: new Date(),
        addedby: "JobPosted Migration",
    };
}

// ----------------- 4. Migration Function -----------------
async function migrateJobPosted() {
    const failedMigrations = [];
    let successCount = 0;

    try {
        const jobData = await getJobPostedData();
        console.log(`📦 Found ${jobData.length} rows in job_posted`);

        for (const item of jobData) {
            try {
                const slugDoc = new Slug(prepareSlugFromJob(item));
                await slugDoc.save();
                successCount++;
                console.log(`✅ Migrated Job ID: ${item?.jobposted_id} -> ${slugDoc.slug}`);
            } catch (err) {
                failedMigrations.push({ id: item?.jobposted_id, error: err.message });
                console.error(`❌ Error migrating Job ID ${item?.jobposted_id}: ${err.message}`);
            }
        }

        console.log('\n--- Migration Summary ---');
        console.log(`Total Rows: ${jobData.length}`);
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
migrateJobPosted();

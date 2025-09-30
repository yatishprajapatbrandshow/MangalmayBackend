const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const Slug = require('./slug.model'); // your Slug schema

// ----------------- 1. MongoDB Connect -----------------
mongoose.connect('mongodb+srv://brandshow:xS36OgTIDikH3V4Q@cluster0.k22pflm.mongodb.net/MIMT?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// ----------------- 2. MySQL Connect -----------------
async function getSubTblData() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'mangalmayseconddb'
    });

    const [rows] = await connection.execute('SELECT * FROM sub_tbl');
    await connection.end();
    return rows;
}

// ----------------- 3. Helper: Prepare Mongo Data -----------------
function prepareSlugData(item) {
    const data = {
        page_id: Number(item.page_id) || Number(item.id),
        parent_id: Number(item.parent_id) || 0,
        template_id: Number(item.template_id) || 0,
        clg_id: Number(item.clg_id) || 0,
        name: item.name || `Page ${item.id}`,
        shortdesc: item.shortdesc || '',
        description: item.description || '',

        // Params dynamically
        param1: item.param1 || '',
        paramvalue1: item.paramvalue1 || '',
        param_img1: item.param_img1 || '',
        param_url1: item.param_url1 || '',

        param2: item.param2 || '',
        paramvalue2: item.paramvalue2 || '',
        param_img2: item.param_img2 || '',
        param_url2: item.param_url2 || '',

        param3: item.param3 || '',
        paramvalue3: item.paramvalue3 || '',
        param_img3: item.param_img3 || '',
        param_url3: item.param_url3 || '',

        param4: item.param4 || '',
        paramvalue4: item.paramvalue4 || '',
        param_img4: item.param_img4 || '',
        param_url4: item.param_url4 || '',

        param5: item.param5 || '',
        paramvalue5: item.paramvalue5 || '',
        param_img5: item.param_img5 || '',
        param_url5: item.param_url5 || '',

        param6: item.param6 || '',
        paramvalue6: item.paramvalue6 || '',
        param_img6: item.param_img6 || '',
        param_url6: item.param_url6 || '',

        param7: item.param7 || '',
        paramvalue7: item.paramvalue7 || '',
        param_img7: item.param_img7 || '',
        param_url7: item.param_url7 || '',

        param8: item.param8 || '',
        paramvalue8: item.paramvalue8 || '',
        param_img8: item.param_img8 || '',
        param_url8: item.param_url8 || '',

        param9: item.param9 || '',
        paramvalue9: item.paramvalue9 || '',
        param_img9: item.param_img9 || '',
        param_url9: item.param_url9 || '',

        param10: item.param10 || '',
        paramvalue10: item.paramvalue10 || '',
        param_img10: item.param_img10 || '',
        param_url10: item.param_url10 || '',

        banner_img: item.banner_img || '',
        slug: item.slug || item.name?.toLowerCase().replace(/\s+/g, '-') || `page-${item.id}`,
        metatitle: item.metatitle || '',
        metadesc: item.metadesc || '',
        keywords_tag: item.keywords_tag || '',
        tag1: item.tag1 || '',
        tag2: item.tag2 || '',
        tag3: item.tag3 || '',
        schemaid: item.schemaid || '',
        nic_name: item.nic_name || '',
        col_width: item.col_width || '',
        featured_img: item.featured_img || '',
        video_url: item.video_url || '',
        date: item.date ? new Date(item.date) : new Date(),
        featured_status: item.featured_status !== undefined ? Boolean(item.featured_status) : false,
        type: item.type
            ? item.type.charAt(0).toUpperCase() + item.type.slice(1)
            : '',
        path: !item.path.startsWith('/') ? "/" + item.path : item.path || `/${item.slug || item.name}`,
        id_path: item.id_path || `/${item.page_id || item.id}`,
        old_url: item.old_url || '',
        status: item.status !== undefined ? Boolean(item.status) : true,
        addedon: item.addedon ? new Date(item.addedon) : new Date(),
        addedby: "sub_tbl migrate" || 'Admin',
        editedon: item.editedon ? new Date(item.editedon) : undefined,
        editedby: "sub_tbl migrate" || 'Admin',
        deleteflag: item.deleteflag !== undefined ? Boolean(item.deleteflag) : false
    };

    return data;
}

// ----------------- 4. Migration Function -----------------
async function migrateSubTbl() {
    const failedMigrations = [];
    let successCount = 0;

    try {
        const subData = await getSubTblData();
        console.log(`Found ${subData.length} rows in sub_tbl`);

        for (const item of subData) {
            try {
                const slugDoc = new Slug(prepareSlugData(item));
                await slugDoc.save();
                successCount++;
                console.log(`✅ Migrated ID: ${item.id || item.page_id} -> ${slugDoc.slug}`);
            } catch (err) {
                failedMigrations.push({ id: item.id || item.page_id, error: err.message });
                console.error(`❌ Error migrating ID ${item.id || item.page_id}: ${err.message}`);
            }
        }

        console.log('\n--- Migration Summary ---');
        console.log(`Total Rows: ${subData.length}`);
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
migrateSubTbl();

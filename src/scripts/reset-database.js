const sdk = require('node-appwrite');
require('dotenv').config({ path: '.env' });

const client = new sdk.Client();

const databases = new sdk.Databases(client);

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_KEY);

const DB_NAME = 'selfos_db';
const COLLECTIONS = [
    {
        name: 'courses',
        attributes: [
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'description', type: 'string', size: 5000, required: false },
            { key: 'published', type: 'boolean', required: true, default: false },
            { key: 'authorId', type: 'string', size: 255, required: true },
        ]
    },
    {
        name: 'chapters',
        attributes: [
            { key: 'courseId', type: 'string', size: 255, required: true },
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'order', type: 'integer', required: true },
        ]
    },
    {
        name: 'progress',
        attributes: [
            { key: 'userId', type: 'string', size: 255, required: true },
            { key: 'chapterId', type: 'string', size: 255, required: true },
            { key: 'status', type: 'string', size: 50, required: true }, // completed, in-progress
            { key: 'completedAt', type: 'datetime', required: false },
        ]
    },
    {
        name: 'notes',
        attributes: [
            { key: 'userId', type: 'string', size: 255, required: true },
            { key: 'courseId', type: 'string', size: 255, required: true },
            { key: 'chapterId', type: 'string', size: 255, required: true },
            { key: 'content', type: 'string', size: 10000, required: true },
        ]
    },
    {
        name: 'resources',
        attributes: [
            { key: 'chapterId', type: 'string', size: 255, required: true },
            { key: 'name', type: 'string', size: 255, required: true },
            { key: 'type', type: 'string', size: 50, required: true }, // pdf, webpage, youtube, chatgpt, gemini, file
            { key: 'url', type: 'url', required: false }, // External URL
            { key: 'fileId', type: 'string', size: 255, required: false }, // Appwrite storage file ID
        ]
    },
    {
        name: 'user_settings',
        attributes: [
            { key: 'userId', type: 'string', size: 255, required: true },
            { key: 'dailyGoal', type: 'integer', required: true }, // Number of chapters per day
        ]
    },
    {
        name: 'image_notes',
        attributes: [
            { key: 'userId', type: 'string', size: 255, required: true },
            { key: 'courseId', type: 'string', size: 255, required: true },
            { key: 'chapterId', type: 'string', size: 255, required: true },
            { key: 'imageIds', type: 'string', size: 5000, required: true }, // JSON array of file IDs
            { key: 'caption', type: 'string', size: 1000, required: false }, // Optional caption for the images
        ]
    }
];

async function resetDatabase() {
    try {
        console.log('🔍 Looking for existing database...');
        const dbs = await databases.list();
        const existingDb = dbs.databases.find(db => db.name === DB_NAME);
        
        if (existingDb) {
            console.log(`🗑️  Deleting existing database: ${existingDb.$id}`);
            await databases.delete(existingDb.$id);
            console.log('✅ Database deleted successfully');
            // Wait a moment for deletion to propagate
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
            console.log('ℹ️  No existing database found');
        }

        console.log('\n📦 Creating new database...');
        const newDb = await databases.create(sdk.ID.unique(), DB_NAME);
        const dbId = newDb.$id;
        console.log(`✅ Database created: ${dbId}`);

        const configLines = [`export const DATABASE_ID = "${dbId}";`];

        for (const col of COLLECTIONS) {
            console.log(`\n📁 Creating collection: ${col.name}`);
            
            const newCol = await databases.createCollection(
                dbId, 
                sdk.ID.unique(), 
                col.name,
                [
                    sdk.Permission.read(sdk.Role.users()),
                    sdk.Permission.create(sdk.Role.users()),
                    sdk.Permission.update(sdk.Role.users()),
                    sdk.Permission.delete(sdk.Role.users()),
                ]
            );
            const colId = newCol.$id;
            console.log(`   ✅ Collection ${col.name} created: ${colId}`);
            
            configLines.push(`export const COLLECTION_${col.name.toUpperCase()}_ID = "${colId}";`);

            // Create attributes
            for (const attr of col.attributes) {
                try {
                    console.log(`   📝 Creating attribute: ${attr.key}`);
                    if (attr.type === 'string') {
                        await databases.createStringAttribute(dbId, colId, attr.key, attr.size, attr.required, attr.default);
                    } else if (attr.type === 'integer') {
                        await databases.createIntegerAttribute(dbId, colId, attr.key, attr.required, 0, 1000000, attr.default);
                    } else if (attr.type === 'boolean') {
                        await databases.createBooleanAttribute(dbId, colId, attr.key, attr.required, attr.default);
                    } else if (attr.type === 'url') {
                        await databases.createUrlAttribute(dbId, colId, attr.key, attr.required, attr.default);
                    } else if (attr.type === 'datetime') {
                        await databases.createDatetimeAttribute(dbId, colId, attr.key, attr.required, attr.default);
                    }
                    // Wait for attribute to be created
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error(`   ❌ Error creating attribute ${attr.key}:`, error.message);
                }
            }
        }

        console.log('\n\n========================================');
        console.log('🎉 DATABASE SETUP COMPLETE!');
        console.log('========================================\n');
        console.log('📋 Copy the following to src/lib/config.js:\n');
        console.log(configLines.join('\n'));
        console.log('\n// Keep your existing BUCKET_ID and RESOURCE_TYPES');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Setup failed:', error);
    }
}

resetDatabase();

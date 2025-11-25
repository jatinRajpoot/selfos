const sdk = require('node-appwrite');
require('dotenv').config({ path: '.env' });

const client = new sdk.Client();

const databases = new sdk.Databases(client);

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) // Your API Endpoint
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) // Your project ID
    .setKey(process.env.APPWRITE_KEY); // Your secret API key

const DB_NAME = 'selfos_db';
const COLLECTIONS = [
    {
        name: 'courses',
        attributes: [
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'description', type: 'string', size: 5000, required: false },
            { key: 'coverImage', type: 'url', required: false },
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
        name: 'topics',
        attributes: [
            { key: 'chapterId', type: 'string', size: 255, required: true },
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'content', type: 'string', size: 100000, required: false }, // Markdown content
            { key: 'videoUrl', type: 'url', required: false },
            { key: 'type', type: 'string', size: 50, required: true }, // video, text, youtube, article
            { key: 'order', type: 'integer', required: true },
        ]
    },
    {
        name: 'progress',
        attributes: [
            { key: 'userId', type: 'string', size: 255, required: true },
            { key: 'topicId', type: 'string', size: 255, required: true },
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
            { key: 'topicId', type: 'string', size: 255, required: true },
            { key: 'content', type: 'string', size: 10000, required: true },
        ]
    },
    {
        name: 'resources',
        attributes: [
            { key: 'topicId', type: 'string', size: 255, required: true },
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
            { key: 'dailyGoal', type: 'integer', required: true }, // Number of lessons per day
        ]
    }
];

async function setup() {
    let dbId;
    try {
        console.log('Checking for database...');
        const dbs = await databases.list();
        const existingDb = dbs.databases.find(db => db.name === DB_NAME);
        
        if (existingDb) {
            console.log('Database exists:', existingDb.$id);
            dbId = existingDb.$id;
        } else {
            console.log('Creating database...');
            const newDb = await databases.create(sdk.ID.unique(), DB_NAME);
            dbId = newDb.$id;
            console.log('Database created:', dbId);
        }

        const configLines = [`export const DATABASE_ID = "${dbId}";`];

        for (const col of COLLECTIONS) {
            console.log(`Processing collection: ${col.name}`);
            let colId;
            try {
                const existingCols = await databases.listCollections(dbId);
                const existingCol = existingCols.collections.find(c => c.name === col.name);
                
                if (existingCol) {
                    console.log(`Collection ${col.name} exists:`, existingCol.$id);
                    colId = existingCol.$id;
                } else {
                    console.log(`Creating collection ${col.name}...`);
                    const newCol = await databases.createCollection(dbId, sdk.ID.unique(), col.name);
                    colId = newCol.$id;
                    console.log(`Collection ${col.name} created:`, colId);
                }
                
                configLines.push(`export const COLLECTION_${col.name.toUpperCase()}_ID = "${colId}";`);

                // Create attributes
                for (const attr of col.attributes) {
                    try {
                        // Check if attribute exists (simplified check, just try to create and catch error if exists)
                        // In a robust script we would list attributes first, but for setup this is okay
                        // Actually, listing is safer to avoid errors in logs
                        const attrs = await databases.listAttributes(dbId, colId);
                        const existingAttr = attrs.attributes.find(a => a.key === attr.key);

                        if (!existingAttr) {
                            console.log(`Creating attribute ${attr.key} for ${col.name}...`);
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
                            // Wait a bit for attribute to be created
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } else {
                            console.log(`Attribute ${attr.key} already exists.`);
                        }
                    } catch (error) {
                        console.error(`Error creating attribute ${attr.key}:`, error.message);
                    }
                }

            } catch (error) {
                console.error(`Error processing collection ${col.name}:`, error.message);
            }
        }

        console.log('\n--- CONFIGURATION ---');
        console.log(configLines.join('\n'));
        console.log('---------------------');

    } catch (error) {
        console.error('Setup failed:', error);
    }
}

setup();

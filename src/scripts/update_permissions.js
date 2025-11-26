const sdk = require('node-appwrite');
require('dotenv').config({ path: '.env' });

const client = new sdk.Client();
const databases = new sdk.Databases(client);

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_KEY);

const DB_NAME = 'selfos_db';

const PERMISSIONS = {
    public: [
        sdk.Permission.read(sdk.Role.any()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users()),
        sdk.Permission.delete(sdk.Role.users()),
    ],
    private: [
        sdk.Permission.read(sdk.Role.users()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users()),
        sdk.Permission.delete(sdk.Role.users()),
    ]
};

const COLLECTION_PERMISSIONS = {
    'courses': PERMISSIONS.public,
    'chapters': PERMISSIONS.public,
    'resources': PERMISSIONS.public,
    'progress': PERMISSIONS.private,
    'notes': PERMISSIONS.private,
    'user_settings': PERMISSIONS.private,
    'image_notes': PERMISSIONS.private,
};

async function updatePermissions() {
    try {
        console.log('Fetching database...');
        const dbs = await databases.list();
        const db = dbs.databases.find(d => d.name === DB_NAME);

        if (!db) {
            console.error('Database not found!');
            return;
        }

        console.log('Fetching collections...');
        const cols = await databases.listCollections(db.$id);

        for (const col of cols.collections) {
            const perms = COLLECTION_PERMISSIONS[col.name];
            if (perms) {
                console.log(`Updating permissions for ${col.name}...`);
                await databases.updateCollection(
                    db.$id,
                    col.$id,
                    col.name,
                    perms,
                    true // documentSecurity: true (allows creators to manage their own docs)
                );
                console.log(`Permissions updated for ${col.name}`);
            }
        }
        console.log('All permissions updated successfully.');

    } catch (error) {
        console.error('Error updating permissions:', error);
    }
}

updatePermissions();

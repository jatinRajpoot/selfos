import { Client, Databases, Users } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_KEY);

const databases = new Databases(client);
const users = new Users(client);

export { client, databases, users };

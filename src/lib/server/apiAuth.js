import { databases } from "./appwrite";
import { DATABASE_ID, COLLECTION_API_KEYS_ID } from "@/lib/config";
import { Query } from "node-appwrite";
import crypto from "crypto";

/**
 * Hash an API key using SHA-256
 * @param {string} apiKey - The plain text API key
 * @returns {string} The hashed key
 */
export function hashApiKey(apiKey) {
    return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Generate a new API key
 * @returns {string} A random API key prefixed with 'sos_'
 */
export function generateApiKey() {
    const randomBytes = crypto.randomBytes(32).toString("hex");
    return `sos_${randomBytes}`;
}

/**
 * Validate an API key and return the associated userId
 * Also updates the lastUsed timestamp
 * @param {string} apiKey - The API key to validate
 * @returns {Promise<{userId: string, keyId: string} | null>} The userId if valid, null otherwise
 */
export async function validateApiKey(apiKey) {
    if (!apiKey || !apiKey.startsWith("sos_")) {
        return null;
    }

    try {
        const keyHash = hashApiKey(apiKey);
        
        const result = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_API_KEYS_ID,
            [Query.equal("keyHash", keyHash), Query.limit(1)]
        );

        if (result.documents.length === 0) {
            return null;
        }

        const keyDoc = result.documents[0];

        // Update lastUsed timestamp (fire and forget)
        databases.updateDocument(
            DATABASE_ID,
            COLLECTION_API_KEYS_ID,
            keyDoc.$id,
            { lastUsed: new Date().toISOString() }
        ).catch(err => console.error("Failed to update lastUsed:", err));

        return {
            userId: keyDoc.userId,
            keyId: keyDoc.$id
        };
    } catch (error) {
        console.error("API key validation error:", error);
        return null;
    }
}

/**
 * Middleware-style function to authenticate API requests
 * Returns userId or sends error response
 * @param {Request} request - The incoming request
 * @returns {Promise<{userId: string} | {error: Response}>}
 */
export async function authenticateApiRequest(request) {
    const apiKey = request.headers.get("x-api-key");
    
    if (!apiKey) {
        return {
            error: { message: "API key required. Include 'x-api-key' header.", status: 401 }
        };
    }

    const result = await validateApiKey(apiKey);
    
    if (!result) {
        return {
            error: { message: "Invalid API key", status: 401 }
        };
    }

    return { userId: result.userId, keyId: result.keyId };
}

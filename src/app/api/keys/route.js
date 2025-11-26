import { NextResponse } from "next/server";
import { databases, users } from "@/lib/server/appwrite";
import { generateApiKey, hashApiKey } from "@/lib/server/apiAuth";
import { DATABASE_ID, COLLECTION_API_KEYS_ID } from "@/lib/config";
import { Query, ID } from "node-appwrite";

/**
 * GET /api/keys - List all API keys for the authenticated user
 * Requires userId query parameter (validated against Appwrite users)
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Verify user exists
    try {
        await users.get(userId);
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized - Invalid user" }, { status: 401 });
    }

    try {
        const result = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_API_KEYS_ID,
            [Query.equal("userId", userId), Query.orderDesc("$createdAt")]
        );

        // Return keys without the hash for security
        const keys = result.documents.map(doc => ({
            id: doc.$id,
            name: doc.name,
            createdAt: doc.createdAt,
            lastUsed: doc.lastUsed || null,
            // Show only last 4 characters as hint
            keyHint: `sos_****${doc.keyHash.slice(-4)}`
        }));

        return NextResponse.json({ keys });
    } catch (error) {
        console.error("Error listing API keys:", error);
        return NextResponse.json({ error: "Failed to list API keys" }, { status: 500 });
    }
}

/**
 * POST /api/keys - Generate a new API key
 * Body: { userId, name }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, name } = body;

        if (!userId || !name) {
            return NextResponse.json(
                { error: "userId and name are required" },
                { status: 400 }
            );
        }

        // Verify user exists
        try {
            await users.get(userId);
        } catch (error) {
            return NextResponse.json({ error: "Unauthorized - Invalid user" }, { status: 401 });
        }

        // Check if user already has 5 keys (limit)
        const existingKeys = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_API_KEYS_ID,
            [Query.equal("userId", userId)]
        );

        if (existingKeys.documents.length >= 5) {
            return NextResponse.json(
                { error: "Maximum of 5 API keys allowed per user. Please delete an existing key." },
                { status: 400 }
            );
        }

        // Generate new key
        const apiKey = generateApiKey();
        const keyHash = hashApiKey(apiKey);

        // Store in database
        const keyDoc = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_API_KEYS_ID,
            ID.unique(),
            {
                userId,
                keyHash,
                name: name.slice(0, 100),
                createdAt: new Date().toISOString(),
            }
        );

        // Return the plain key ONLY ONCE - it cannot be retrieved again
        return NextResponse.json({
            id: keyDoc.$id,
            name: keyDoc.name,
            apiKey, // Plain text key - display to user immediately
            createdAt: keyDoc.createdAt,
            warning: "Save this API key now. You won't be able to see it again!"
        });
    } catch (error) {
        console.error("Error creating API key:", error);
        return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
    }
}

/**
 * DELETE /api/keys - Delete an API key
 * Query params: userId, keyId
 */
export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const keyId = searchParams.get("keyId");

    if (!userId || !keyId) {
        return NextResponse.json(
            { error: "userId and keyId are required" },
            { status: 400 }
        );
    }

    // Verify user exists
    try {
        await users.get(userId);
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized - Invalid user" }, { status: 401 });
    }

    try {
        // Verify the key belongs to this user
        const keyDoc = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_API_KEYS_ID,
            keyId
        );

        if (keyDoc.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Delete the key
        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTION_API_KEYS_ID,
            keyId
        );

        return NextResponse.json({ success: true, message: "API key deleted" });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "API key not found" }, { status: 404 });
        }
        console.error("Error deleting API key:", error);
        return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
    }
}

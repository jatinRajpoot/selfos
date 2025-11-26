import { NextResponse } from "next/server";
import { databases } from "@/lib/server/appwrite";
import { authenticateApiRequest } from "@/lib/server/apiAuth";
import { 
    DATABASE_ID, 
    COLLECTION_COURSES_ID, 
    COLLECTION_CHAPTERS_ID,
    COLLECTION_RESOURCES_ID,
    RESOURCE_TYPES
} from "@/lib/config";
import { Query, ID } from "node-appwrite";

/**
 * GET /api/gpt/resources - List resources for a chapter
 * Query params: chapterId (required)
 */
export async function GET(request) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    try {
        const { searchParams } = new URL(request.url);
        const chapterId = searchParams.get("chapterId");

        if (!chapterId) {
            return NextResponse.json({ error: "chapterId is required" }, { status: 400 });
        }

        // Verify chapter ownership through course
        try {
            const chapter = await databases.getDocument(DATABASE_ID, COLLECTION_CHAPTERS_ID, chapterId);
            const course = await databases.getDocument(DATABASE_ID, COLLECTION_COURSES_ID, chapter.courseId);
            
            if (course.authorId !== auth.userId) {
                return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
            }
        } catch {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        const resourcesResult = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_RESOURCES_ID,
            [Query.equal("chapterId", chapterId), Query.limit(100)]
        );

        const resources = resourcesResult.documents.map(r => ({
            id: r.$id,
            name: r.name,
            type: r.type,
            url: r.url || null,
            fileId: r.fileId || null,
            createdAt: r.$createdAt
        }));

        return NextResponse.json({ 
            chapterId,
            resources,
            total: resources.length
        });
    } catch (error) {
        console.error("Error fetching resources:", error);
        return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
    }
}

/**
 * POST /api/gpt/resources - Create a new resource
 * Body: { chapterId, name, type, url? }
 * Note: File uploads not supported via API, only URL-based resources
 */
export async function POST(request) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    try {
        const body = await request.json();
        const { chapterId, name, type, url } = body;

        if (!chapterId || !name || !type) {
            return NextResponse.json(
                { error: "chapterId, name, and type are required" },
                { status: 400 }
            );
        }

        // Validate type
        const validTypes = Object.values(RESOURCE_TYPES);
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
                { status: 400 }
            );
        }

        // For URL-based types, require URL
        const urlRequiredTypes = [RESOURCE_TYPES.WEBPAGE, RESOURCE_TYPES.YOUTUBE, RESOURCE_TYPES.CHATGPT, RESOURCE_TYPES.GEMINI];
        if (urlRequiredTypes.includes(type) && !url) {
            return NextResponse.json(
                { error: `URL is required for type '${type}'` },
                { status: 400 }
            );
        }

        // Verify chapter ownership through course
        let chapter, course;
        try {
            chapter = await databases.getDocument(DATABASE_ID, COLLECTION_CHAPTERS_ID, chapterId);
            course = await databases.getDocument(DATABASE_ID, COLLECTION_COURSES_ID, chapter.courseId);
            
            if (course.authorId !== auth.userId) {
                return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
            }
        } catch {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        // Create resource
        const resource = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_RESOURCES_ID,
            ID.unique(),
            {
                chapterId,
                name: name.trim().slice(0, 255),
                type,
                url: url || null
            }
        );

        return NextResponse.json({
            id: resource.$id,
            chapterId: resource.chapterId,
            name: resource.name,
            type: resource.type,
            url: resource.url,
            createdAt: resource.$createdAt
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating resource:", error);
        return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
    }
}

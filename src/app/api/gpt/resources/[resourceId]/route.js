import { NextResponse } from "next/server";
import { databases } from "@/lib/server/appwrite";
import { authenticateApiRequest } from "@/lib/server/apiAuth";
import { 
    DATABASE_ID, 
    COLLECTION_COURSES_ID, 
    COLLECTION_CHAPTERS_ID,
    COLLECTION_RESOURCES_ID
} from "@/lib/config";

/**
 * GET /api/gpt/resources/[resourceId] - Get a single resource
 */
export async function GET(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { resourceId } = await params;

    try {
        const resource = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_RESOURCES_ID,
            resourceId
        );

        // Verify ownership through chapter -> course
        const chapter = await databases.getDocument(DATABASE_ID, COLLECTION_CHAPTERS_ID, resource.chapterId);
        const course = await databases.getDocument(DATABASE_ID, COLLECTION_COURSES_ID, chapter.courseId);

        if (course.authorId !== auth.userId) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: resource.$id,
            chapterId: resource.chapterId,
            chapterTitle: chapter.title,
            courseId: course.$id,
            courseTitle: course.title,
            name: resource.name,
            type: resource.type,
            url: resource.url,
            fileId: resource.fileId,
            createdAt: resource.$createdAt
        });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }
        console.error("Error fetching resource:", error);
        return NextResponse.json({ error: "Failed to fetch resource" }, { status: 500 });
    }
}

/**
 * DELETE /api/gpt/resources/[resourceId] - Delete a resource
 */
export async function DELETE(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { resourceId } = await params;

    try {
        const resource = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_RESOURCES_ID,
            resourceId
        );

        // Verify ownership through chapter -> course
        const chapter = await databases.getDocument(DATABASE_ID, COLLECTION_CHAPTERS_ID, resource.chapterId);
        const course = await databases.getDocument(DATABASE_ID, COLLECTION_COURSES_ID, chapter.courseId);

        if (course.authorId !== auth.userId) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }

        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTION_RESOURCES_ID,
            resourceId
        );

        return NextResponse.json({ success: true, message: "Resource deleted" });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }
        console.error("Error deleting resource:", error);
        return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 });
    }
}

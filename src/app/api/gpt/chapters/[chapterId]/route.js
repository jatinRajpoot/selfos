import { NextResponse } from "next/server";
import { databases } from "@/lib/server/appwrite";
import { authenticateApiRequest } from "@/lib/server/apiAuth";
import { 
    DATABASE_ID, 
    COLLECTION_COURSES_ID, 
    COLLECTION_CHAPTERS_ID,
    COLLECTION_PROGRESS_ID,
    COLLECTION_RESOURCES_ID
} from "@/lib/config";
import { Query, ID } from "node-appwrite";

/**
 * Helper to verify chapter ownership through course
 */
async function verifyChapterOwnership(chapterId, userId) {
    try {
        const chapter = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_CHAPTERS_ID,
            chapterId
        );

        const course = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_COURSES_ID,
            chapter.courseId
        );

        if (course.authorId !== userId) {
            return { error: true, status: 404 };
        }

        return { chapter, course };
    } catch (error) {
        return { error: true, status: 404 };
    }
}

/**
 * GET /api/gpt/chapters/[chapterId] - Get a single chapter with resources
 */
export async function GET(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { chapterId } = await params;

    const ownership = await verifyChapterOwnership(chapterId, auth.userId);
    if (ownership.error) {
        return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    try {
        const { chapter, course } = ownership;

        // Get progress
        const progressResult = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_PROGRESS_ID,
            [Query.equal("chapterId", chapterId), Query.equal("userId", auth.userId), Query.limit(1)]
        );

        // Get resources
        const resourcesResult = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_RESOURCES_ID,
            [Query.equal("chapterId", chapterId)]
        );

        const resources = resourcesResult.documents.map(r => ({
            id: r.$id,
            name: r.name,
            type: r.type,
            url: r.url || null,
            fileId: r.fileId || null
        }));

        return NextResponse.json({
            id: chapter.$id,
            title: chapter.title,
            order: chapter.order,
            courseId: course.$id,
            courseTitle: course.title,
            progress: progressResult.documents.length > 0 
                ? { 
                    status: progressResult.documents[0].status,
                    completedAt: progressResult.documents[0].completedAt
                } 
                : null,
            resources
        });
    } catch (error) {
        console.error("Error fetching chapter:", error);
        return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 500 });
    }
}

/**
 * PUT /api/gpt/chapters/[chapterId] - Update a chapter
 * Body: { title?, order? }
 */
export async function PUT(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { chapterId } = await params;

    const ownership = await verifyChapterOwnership(chapterId, auth.userId);
    if (ownership.error) {
        return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    try {
        const body = await request.json();
        const updates = {};

        if (body.title !== undefined) {
            updates.title = body.title.trim().slice(0, 255);
        }
        if (body.order !== undefined && Number.isInteger(body.order) && body.order > 0) {
            updates.order = body.order;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const updated = await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_CHAPTERS_ID,
            chapterId,
            updates
        );

        return NextResponse.json({
            id: updated.$id,
            title: updated.title,
            order: updated.order,
            courseId: updated.courseId
        });
    } catch (error) {
        console.error("Error updating chapter:", error);
        return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 });
    }
}

/**
 * DELETE /api/gpt/chapters/[chapterId] - Delete a chapter and related data
 */
export async function DELETE(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { chapterId } = await params;

    const ownership = await verifyChapterOwnership(chapterId, auth.userId);
    if (ownership.error) {
        return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    try {
        // Delete progress
        const progress = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_PROGRESS_ID,
            [Query.equal("chapterId", chapterId), Query.equal("userId", auth.userId)]
        );
        for (const p of progress.documents) {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_PROGRESS_ID, p.$id);
        }

        // Delete resources
        const resources = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_RESOURCES_ID,
            [Query.equal("chapterId", chapterId)]
        );
        for (const r of resources.documents) {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_RESOURCES_ID, r.$id);
        }

        // Delete the chapter
        await databases.deleteDocument(DATABASE_ID, COLLECTION_CHAPTERS_ID, chapterId);

        return NextResponse.json({ success: true, message: "Chapter deleted" });
    } catch (error) {
        console.error("Error deleting chapter:", error);
        return NextResponse.json({ error: "Failed to delete chapter" }, { status: 500 });
    }
}

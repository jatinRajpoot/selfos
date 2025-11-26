import { NextResponse } from "next/server";
import { databases } from "@/lib/server/appwrite";
import { authenticateApiRequest } from "@/lib/server/apiAuth";
import { 
    DATABASE_ID, 
    COLLECTION_COURSES_ID, 
    COLLECTION_CHAPTERS_ID, 
    COLLECTION_PROGRESS_ID,
    COLLECTION_NOTES_ID,
    COLLECTION_RESOURCES_ID,
    COLLECTION_IMAGE_NOTES_ID
} from "@/lib/config";
import { Query } from "node-appwrite";

/**
 * GET /api/gpt/courses/[courseId] - Get a single course with chapters and progress
 */
export async function GET(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { courseId } = await params;

    try {
        // Get the course
        const course = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_COURSES_ID,
            courseId
        );

        // Verify ownership
        if (course.authorId !== auth.userId) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Get chapters
        const chaptersResult = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_CHAPTERS_ID,
            [Query.equal("courseId", courseId), Query.orderAsc("order"), Query.limit(100)]
        );

        // Get progress for these chapters
        const chapterIds = chaptersResult.documents.map(ch => ch.$id);
        let progressMap = new Map();
        
        if (chapterIds.length > 0) {
            const progressResult = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_PROGRESS_ID,
                [Query.equal("userId", auth.userId), Query.limit(500)]
            );
            progressMap = new Map(
                progressResult.documents
                    .filter(p => chapterIds.includes(p.chapterId))
                    .map(p => [p.chapterId, { status: p.status, completedAt: p.completedAt }])
            );
        }

        const chapters = chaptersResult.documents.map(ch => ({
            id: ch.$id,
            title: ch.title,
            order: ch.order,
            progress: progressMap.get(ch.$id) || null
        }));

        const completedCount = chapters.filter(ch => ch.progress?.status === "completed").length;

        return NextResponse.json({
            id: course.$id,
            title: course.title,
            description: course.description || "",
            published: course.published,
            createdAt: course.$createdAt,
            updatedAt: course.$updatedAt,
            chapters,
            stats: {
                totalChapters: chapters.length,
                completedChapters: completedCount,
                progressPercent: chapters.length > 0 
                    ? Math.round((completedCount / chapters.length) * 100) 
                    : 0
            }
        });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        console.error("Error fetching course:", error);
        return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
    }
}

/**
 * PUT /api/gpt/courses/[courseId] - Update a course
 * Body: { title?, description?, published? }
 */
export async function PUT(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { courseId } = await params;

    try {
        // Verify ownership
        const course = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_COURSES_ID,
            courseId
        );

        if (course.authorId !== auth.userId) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const body = await request.json();
        const updates = {};

        if (body.title !== undefined) {
            updates.title = body.title.trim().slice(0, 255);
        }
        if (body.description !== undefined) {
            updates.description = body.description.slice(0, 5000);
        }
        if (body.published !== undefined) {
            updates.published = Boolean(body.published);
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const updated = await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_COURSES_ID,
            courseId,
            updates
        );

        return NextResponse.json({
            id: updated.$id,
            title: updated.title,
            description: updated.description,
            published: updated.published,
            updatedAt: updated.$updatedAt
        });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        console.error("Error updating course:", error);
        return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
    }
}

/**
 * DELETE /api/gpt/courses/[courseId] - Delete a course and all related data
 */
export async function DELETE(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { courseId } = await params;

    try {
        // Verify ownership
        const course = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_COURSES_ID,
            courseId
        );

        if (course.authorId !== auth.userId) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Get all chapters for this course
        const chapters = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_CHAPTERS_ID,
            [Query.equal("courseId", courseId), Query.limit(500)]
        );
        const chapterIds = chapters.documents.map(ch => ch.$id);

        // Delete related data for each chapter
        for (const chapterId of chapterIds) {
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
        }

        // Delete notes for this course
        const notes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_NOTES_ID,
            [Query.equal("courseId", courseId), Query.equal("userId", auth.userId)]
        );
        for (const n of notes.documents) {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_NOTES_ID, n.$id);
        }

        // Delete image notes for this course
        const imageNotes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_IMAGE_NOTES_ID,
            [Query.equal("courseId", courseId), Query.equal("userId", auth.userId)]
        );
        for (const img of imageNotes.documents) {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_IMAGE_NOTES_ID, img.$id);
        }

        // Finally, delete the course
        await databases.deleteDocument(DATABASE_ID, COLLECTION_COURSES_ID, courseId);

        return NextResponse.json({ success: true, message: "Course and all related data deleted" });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        console.error("Error deleting course:", error);
        return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { databases } from "@/lib/server/appwrite";
import { authenticateApiRequest } from "@/lib/server/apiAuth";
import { 
    DATABASE_ID, 
    COLLECTION_COURSES_ID, 
    COLLECTION_CHAPTERS_ID,
    COLLECTION_PROGRESS_ID
} from "@/lib/config";
import { Query, ID } from "node-appwrite";

/**
 * POST /api/gpt/chapters/[chapterId]/complete - Mark a chapter as completed
 */
export async function POST(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { chapterId } = await params;

    try {
        // Get the chapter
        const chapter = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_CHAPTERS_ID,
            chapterId
        );

        // Verify course ownership
        const course = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_COURSES_ID,
            chapter.courseId
        );

        if (course.authorId !== auth.userId) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        // Check if progress already exists
        const existingProgress = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_PROGRESS_ID,
            [
                Query.equal("userId", auth.userId),
                Query.equal("chapterId", chapterId),
                Query.limit(1)
            ]
        );

        let progress;
        const now = new Date().toISOString();

        if (existingProgress.documents.length > 0) {
            // Update existing progress
            progress = await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_PROGRESS_ID,
                existingProgress.documents[0].$id,
                {
                    status: "completed",
                    completedAt: now
                }
            );
        } else {
            // Create new progress record
            progress = await databases.createDocument(
                DATABASE_ID,
                COLLECTION_PROGRESS_ID,
                ID.unique(),
                {
                    userId: auth.userId,
                    chapterId,
                    status: "completed",
                    completedAt: now
                }
            );
        }

        // Calculate overall course progress
        const allChapters = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_CHAPTERS_ID,
            [Query.equal("courseId", chapter.courseId), Query.limit(200)]
        );

        const allProgress = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_PROGRESS_ID,
            [Query.equal("userId", auth.userId), Query.equal("status", "completed"), Query.limit(500)]
        );

        const completedChapterIds = new Set(allProgress.documents.map(p => p.chapterId));
        const courseChapterIds = allChapters.documents.map(ch => ch.$id);
        const completedInCourse = courseChapterIds.filter(id => completedChapterIds.has(id)).length;

        return NextResponse.json({
            chapterId,
            chapterTitle: chapter.title,
            status: "completed",
            completedAt: now,
            courseProgress: {
                courseId: course.$id,
                courseTitle: course.title,
                completedChapters: completedInCourse,
                totalChapters: allChapters.documents.length,
                progressPercent: allChapters.documents.length > 0 
                    ? Math.round((completedInCourse / allChapters.documents.length) * 100)
                    : 0
            }
        });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }
        console.error("Error marking chapter complete:", error);
        return NextResponse.json({ error: "Failed to mark chapter complete" }, { status: 500 });
    }
}

/**
 * DELETE /api/gpt/chapters/[chapterId]/complete - Unmark a chapter (reset progress)
 */
export async function DELETE(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { chapterId } = await params;

    try {
        // Get the chapter
        const chapter = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_CHAPTERS_ID,
            chapterId
        );

        // Verify course ownership
        const course = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_COURSES_ID,
            chapter.courseId
        );

        if (course.authorId !== auth.userId) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        // Find and delete progress
        const existingProgress = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_PROGRESS_ID,
            [
                Query.equal("userId", auth.userId),
                Query.equal("chapterId", chapterId),
                Query.limit(1)
            ]
        );

        if (existingProgress.documents.length > 0) {
            await databases.deleteDocument(
                DATABASE_ID,
                COLLECTION_PROGRESS_ID,
                existingProgress.documents[0].$id
            );
        }

        return NextResponse.json({
            chapterId,
            chapterTitle: chapter.title,
            status: "reset",
            message: "Chapter progress has been reset"
        });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }
        console.error("Error resetting chapter progress:", error);
        return NextResponse.json({ error: "Failed to reset chapter progress" }, { status: 500 });
    }
}

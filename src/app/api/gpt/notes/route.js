import { NextResponse } from "next/server";
import { databases } from "@/lib/server/appwrite";
import { authenticateApiRequest } from "@/lib/server/apiAuth";
import { 
    DATABASE_ID, 
    COLLECTION_COURSES_ID, 
    COLLECTION_CHAPTERS_ID,
    COLLECTION_NOTES_ID
} from "@/lib/config";
import { Query, ID } from "node-appwrite";

/**
 * GET /api/gpt/notes - List notes for the user
 * Query params: courseId?, chapterId?, limit?
 */
export async function GET(request) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get("courseId");
        const chapterId = searchParams.get("chapterId");
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

        const queries = [
            Query.equal("userId", auth.userId),
            Query.orderDesc("$createdAt"),
            Query.limit(limit)
        ];

        // If courseId is provided, filter by it
        if (courseId) {
            // Verify course ownership
            try {
                const course = await databases.getDocument(DATABASE_ID, COLLECTION_COURSES_ID, courseId);
                if (course.authorId !== auth.userId) {
                    return NextResponse.json({ error: "Course not found" }, { status: 404 });
                }
            } catch {
                return NextResponse.json({ error: "Course not found" }, { status: 404 });
            }
            queries.push(Query.equal("courseId", courseId));
        }

        // If chapterId is provided, filter by it
        if (chapterId) {
            queries.push(Query.equal("chapterId", chapterId));
        }

        const notesResult = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_NOTES_ID,
            queries
        );

        // Get course and chapter titles for context
        const courseIds = [...new Set(notesResult.documents.map(n => n.courseId))];
        const chapterIds = [...new Set(notesResult.documents.map(n => n.chapterId).filter(id => id !== "none"))];

        const courseMap = new Map();
        const chapterMap = new Map();

        if (courseIds.length > 0) {
            for (const cid of courseIds) {
                try {
                    const course = await databases.getDocument(DATABASE_ID, COLLECTION_COURSES_ID, cid);
                    courseMap.set(cid, course.title);
                } catch {
                    courseMap.set(cid, "Unknown Course");
                }
            }
        }

        if (chapterIds.length > 0) {
            for (const chid of chapterIds) {
                try {
                    const chapter = await databases.getDocument(DATABASE_ID, COLLECTION_CHAPTERS_ID, chid);
                    chapterMap.set(chid, chapter.title);
                } catch {
                    chapterMap.set(chid, "Unknown Chapter");
                }
            }
        }

        const notes = notesResult.documents.map(n => ({
            id: n.$id,
            content: n.content,
            courseId: n.courseId,
            courseTitle: courseMap.get(n.courseId) || "Quick Note",
            chapterId: n.chapterId,
            chapterTitle: n.chapterId === "none" ? "Quick Note" : (chapterMap.get(n.chapterId) || "Unknown"),
            createdAt: n.$createdAt,
            updatedAt: n.$updatedAt
        }));

        return NextResponse.json({ notes, total: notesResult.total });
    } catch (error) {
        console.error("Error fetching notes:", error);
        return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }
}

/**
 * POST /api/gpt/notes - Create a new note
 * Body: { content, courseId?, chapterId? }
 * If courseId and chapterId are not provided, creates a "quick note"
 */
export async function POST(request) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    try {
        const body = await request.json();
        const { content, courseId, chapterId } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        // For non-quick notes, verify ownership
        let finalCourseId = courseId || "none";
        let finalChapterId = chapterId || "none";

        if (courseId && courseId !== "none") {
            try {
                const course = await databases.getDocument(DATABASE_ID, COLLECTION_COURSES_ID, courseId);
                if (course.authorId !== auth.userId) {
                    return NextResponse.json({ error: "Course not found" }, { status: 404 });
                }
            } catch {
                return NextResponse.json({ error: "Course not found" }, { status: 404 });
            }
        }

        if (chapterId && chapterId !== "none") {
            try {
                const chapter = await databases.getDocument(DATABASE_ID, COLLECTION_CHAPTERS_ID, chapterId);
                // Verify chapter belongs to the course
                if (courseId && chapter.courseId !== courseId) {
                    return NextResponse.json({ error: "Chapter does not belong to the specified course" }, { status: 400 });
                }
                // If no courseId provided, use the chapter's courseId
                if (!courseId) {
                    finalCourseId = chapter.courseId;
                    // Verify course ownership
                    const course = await databases.getDocument(DATABASE_ID, COLLECTION_COURSES_ID, chapter.courseId);
                    if (course.authorId !== auth.userId) {
                        return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
                    }
                }
            } catch {
                return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
            }
        }

        const note = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_NOTES_ID,
            ID.unique(),
            {
                userId: auth.userId,
                courseId: finalCourseId,
                chapterId: finalChapterId,
                content: content.trim().slice(0, 10000)
            }
        );

        return NextResponse.json({
            id: note.$id,
            content: note.content,
            courseId: note.courseId,
            chapterId: note.chapterId,
            createdAt: note.$createdAt
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating note:", error);
        return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }
}

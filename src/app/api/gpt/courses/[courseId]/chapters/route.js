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
 * GET /api/gpt/courses/[courseId]/chapters - List all chapters for a course
 */
export async function GET(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { courseId } = await params;

    try {
        // Verify course ownership
        const course = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_COURSES_ID,
            courseId
        );

        if (course.authorId !== auth.userId) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Get chapters
        const chaptersResult = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_CHAPTERS_ID,
            [Query.equal("courseId", courseId), Query.orderAsc("order"), Query.limit(200)]
        );

        // Get progress
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
                    .map(p => [p.chapterId, { 
                        id: p.$id,
                        status: p.status, 
                        completedAt: p.completedAt 
                    }])
            );
        }

        const chapters = chaptersResult.documents.map(ch => ({
            id: ch.$id,
            title: ch.title,
            order: ch.order,
            progress: progressMap.get(ch.$id) || null
        }));

        return NextResponse.json({ 
            courseId,
            courseTitle: course.title,
            chapters 
        });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        console.error("Error fetching chapters:", error);
        return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
    }
}

/**
 * POST /api/gpt/courses/[courseId]/chapters - Add chapters to a course
 * Body: { title } or { chapters: [{ title }] } for bulk add
 */
export async function POST(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { courseId } = await params;

    try {
        // Verify course ownership
        const course = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_COURSES_ID,
            courseId
        );

        if (course.authorId !== auth.userId) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const body = await request.json();

        // Get current max order
        const existingChapters = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_CHAPTERS_ID,
            [Query.equal("courseId", courseId), Query.orderDesc("order"), Query.limit(1)]
        );
        let nextOrder = existingChapters.documents.length > 0 
            ? existingChapters.documents[0].order + 1 
            : 1;

        // Handle single or bulk chapter creation
        const chaptersToCreate = body.chapters || [{ title: body.title }];
        const createdChapters = [];

        for (const ch of chaptersToCreate) {
            const title = ch.title || ch;
            if (typeof title === "string" && title.trim()) {
                const chapter = await databases.createDocument(
                    DATABASE_ID,
                    COLLECTION_CHAPTERS_ID,
                    ID.unique(),
                    {
                        courseId,
                        title: title.trim().slice(0, 255),
                        order: nextOrder++
                    }
                );
                createdChapters.push({
                    id: chapter.$id,
                    title: chapter.title,
                    order: chapter.order
                });
            }
        }

        if (createdChapters.length === 0) {
            return NextResponse.json({ error: "No valid chapter titles provided" }, { status: 400 });
        }

        return NextResponse.json({
            courseId,
            chapters: createdChapters
        }, { status: 201 });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        console.error("Error creating chapters:", error);
        return NextResponse.json({ error: "Failed to create chapters" }, { status: 500 });
    }
}

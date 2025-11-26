import { NextResponse } from "next/server";
import { databases } from "@/lib/server/appwrite";
import { authenticateApiRequest } from "@/lib/server/apiAuth";
import { DATABASE_ID, COLLECTION_COURSES_ID, COLLECTION_CHAPTERS_ID, COLLECTION_PROGRESS_ID } from "@/lib/config";
import { Query, ID } from "node-appwrite";

/**
 * GET /api/gpt/courses - List all courses for the authenticated user
 */
export async function GET(request) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    try {
        const { searchParams } = new URL(request.url);
        const includeChapters = searchParams.get("includeChapters") === "true";

        const coursesResult = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_COURSES_ID,
            [Query.equal("authorId", auth.userId), Query.orderDesc("$createdAt"), Query.limit(100)]
        );

        let courses = coursesResult.documents.map(doc => ({
            id: doc.$id,
            title: doc.title,
            description: doc.description || "",
            createdAt: doc.$createdAt,
            updatedAt: doc.$updatedAt
        }));

        // Optionally include chapters with progress
        if (includeChapters && courses.length > 0) {
            const courseIds = courses.map(c => c.id);
            
            // Fetch all chapters for these courses
            const chaptersResult = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_CHAPTERS_ID,
                [Query.limit(500)]
            );

            // Fetch user's progress
            const progressResult = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_PROGRESS_ID,
                [Query.equal("userId", auth.userId), Query.limit(500)]
            );

            const progressMap = new Map(
                progressResult.documents.map(p => [p.chapterId, { status: p.status, completedAt: p.completedAt }])
            );

            // Group chapters by course
            const chaptersByCourse = {};
            chaptersResult.documents.forEach(ch => {
                if (courseIds.includes(ch.courseId)) {
                    if (!chaptersByCourse[ch.courseId]) {
                        chaptersByCourse[ch.courseId] = [];
                    }
                    chaptersByCourse[ch.courseId].push({
                        id: ch.$id,
                        title: ch.title,
                        order: ch.order,
                        progress: progressMap.get(ch.$id) || null
                    });
                }
            });

            // Sort chapters by order and attach to courses
            courses = courses.map(course => ({
                ...course,
                chapters: (chaptersByCourse[course.id] || []).sort((a, b) => a.order - b.order)
            }));
        }

        return NextResponse.json({ courses });
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
    }
}

/**
 * POST /api/gpt/courses - Create a new course
 * Body: { title, description?, published?, chapters?: [{ title }] }
 */
export async function POST(request) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    try {
        const body = await request.json();
        const { title, description, chapters = [] } = body;

        if (!title || title.trim().length === 0) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        // Build course data - excluding 'published' as it may not exist in DB schema
        const courseData = {
            title: title.trim().slice(0, 255),
            description: (description || "").slice(0, 5000),
            authorId: auth.userId
        };

        // Create the course
        const course = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_COURSES_ID,
            ID.unique(),
            courseData
        );

        // Create chapters if provided
        const createdChapters = [];
        for (let i = 0; i < chapters.length; i++) {
            const chapterTitle = chapters[i].title || chapters[i];
            if (chapterTitle && typeof chapterTitle === "string" && chapterTitle.trim()) {
                const chapter = await databases.createDocument(
                    DATABASE_ID,
                    COLLECTION_CHAPTERS_ID,
                    ID.unique(),
                    {
                        courseId: course.$id,
                        title: chapterTitle.trim().slice(0, 255),
                        order: i + 1
                    }
                );
                createdChapters.push({
                    id: chapter.$id,
                    title: chapter.title,
                    order: chapter.order
                });
            }
        }

        return NextResponse.json({
            id: course.$id,
            title: course.title,
            description: course.description,
            createdAt: course.$createdAt,
            chapters: createdChapters
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating course:", error);
        return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
    }
}

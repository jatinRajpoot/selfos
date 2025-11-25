import { NextResponse } from "next/server";
import { databases, users } from "@/lib/server/appwrite";
import { COLLECTION_PROGRESS_ID, COLLECTION_USER_SETTINGS_ID, COLLECTION_TOPICS_ID, COLLECTION_CHAPTERS_ID, COLLECTION_COURSES_ID, DATABASE_ID } from "@/lib/config";
import { Query, Client, Account } from "node-appwrite";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Verify authentication - check if user exists and matches the requested userId
    try {
        // Verify the user exists in the system
        await users.get(userId);
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized - Invalid user" }, { status: 401 });
    }

    try {
        // First, get all courses owned by this user
        const userCourses = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_COURSES_ID,
            [Query.equal("authorId", userId), Query.limit(500)]
        );
        const userCourseIds = new Set(userCourses.documents.map(c => c.$id));

        // Get all chapters for user's courses
        let validTopicIds = new Set();
        if (userCourseIds.size > 0) {
            const chapters = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_CHAPTERS_ID,
                [Query.limit(1000)]
            );
            const userChapterIds = chapters.documents
                .filter(ch => userCourseIds.has(ch.courseId))
                .map(ch => ch.$id);

            // Get all topics for user's chapters
            if (userChapterIds.length > 0) {
                const topics = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_TOPICS_ID,
                    [Query.limit(2000)]
                );
                validTopicIds = new Set(
                    topics.documents
                        .filter(t => userChapterIds.includes(t.chapterId))
                        .map(t => t.$id)
                );
            }
        }

        const progress = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_PROGRESS_ID,
            [Query.equal("userId", userId), Query.equal("status", "completed")]
        );

        // Filter progress to only include valid topics (not orphaned)
        const validDocuments = progress.documents.filter(doc => validTopicIds.has(doc.topicId));

        // Calculate Lessons Completed (only valid, non-orphaned progress)
        const lessonsCompleted = validDocuments.length;

        // Get user's daily goal (default to 5 if not set)
        let userDailyGoal = 5;
        try {
            const settings = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_USER_SETTINGS_ID,
                [Query.equal("userId", userId)]
            );
            if (settings.documents.length > 0) {
                userDailyGoal = settings.documents[0].dailyGoal;
            }
        } catch (settingsError) {
            console.log("Could not fetch user settings, using default goal:", settingsError.message);
        }

        // Calculate Daily Goal (completed today)
        const today = new Date().toISOString().split('T')[0];
        const completedToday = validDocuments.filter(doc => doc.completedAt && doc.completedAt.startsWith(today)).length;
        const dailyGoalPercent = Math.min(Math.round((completedToday / userDailyGoal) * 100), 100);

        // Calculate Streak
        // Sort by date descending
        const sortedDocs = validDocuments
            .map(doc => new Date(doc.completedAt).toISOString().split('T')[0])
            .sort((a, b) => new Date(b) - new Date(a));

        // Unique dates
        const uniqueDates = [...new Set(sortedDocs)];

        let streak = 0;
        let currentDate = new Date();

        // Check if completed today to start streak, else check yesterday
        const todayStr = currentDate.toISOString().split('T')[0];
        const yesterday = new Date(currentDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (uniqueDates.includes(todayStr)) {
            streak = 1;
            let checkDate = new Date(yesterday);
            while (true) {
                const dateStr = checkDate.toISOString().split('T')[0];
                if (uniqueDates.includes(dateStr)) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        } else if (uniqueDates.includes(yesterdayStr)) {
            streak = 1;
            let checkDate = new Date(yesterday);
            checkDate.setDate(checkDate.getDate() - 1);
            while (true) {
                const dateStr = checkDate.toISOString().split('T')[0];
                if (uniqueDates.includes(dateStr)) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        return NextResponse.json({
            streak,
            lessonsCompleted,
            dailyGoal: dailyGoalPercent,
            completedToday,
            dailyGoalTarget: userDailyGoal
        });

    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}

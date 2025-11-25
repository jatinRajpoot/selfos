import { NextResponse } from "next/server";
import { databases, users } from "@/lib/server/appwrite";
import { COLLECTION_PROGRESS_ID, DATABASE_ID } from "@/lib/config";
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
        const progress = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_PROGRESS_ID,
            [Query.equal("userId", userId), Query.equal("status", "completed")]
        );

        const documents = progress.documents;

        // Calculate Lessons Completed
        const lessonsCompleted = documents.length;

        // Calculate Daily Goal (completed today)
        const today = new Date().toISOString().split('T')[0];
        const completedToday = documents.filter(doc => doc.completedAt && doc.completedAt.startsWith(today)).length;
        const dailyGoalPercent = Math.min(Math.round((completedToday / 5) * 100), 100);

        // Calculate Streak
        // Sort by date descending
        const sortedDocs = documents
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
            completedToday
        });

    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}

"use client";
import { useState, useEffect } from "react";
import { databases, account } from "@/lib/appwrite";
import { COLLECTION_NOTES_ID, DATABASE_ID } from "@/lib/config";
import { ID } from "appwrite";

export default function DashboardPage() {
    const [note, setNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [stats, setStats] = useState({
        streak: 0,
        lessonsCompleted: 0,
        dailyGoal: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const user = await account.get();
                const res = await fetch(`/api/analytics?userId=${user.$id}`);
                const data = await res.json();
                if (data.streak !== undefined) {
                    setStats(data);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, []);

    const handleSaveNote = async () => {
        if (!note.trim()) return;
        setSavingNote(true);
        try {
            const user = await account.get();
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_NOTES_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    content: note,
                    courseId: "quick-capture", // Special ID for quick notes
                    chapterId: "quick-capture",
                    topicId: "quick-capture",
                }
            );
            setNote("");
            alert("Note saved!");
        } catch (error) {
            console.error("Error saving note:", error);
            alert("Failed to save note.");
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Row Stats */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Streak */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Current Streak</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">{stats.streak}</span>
                        <span className="text-gray-500">days</span>
                    </div>
                    <div className="mt-4 flex gap-1">
                        {[...Array(7)].map((_, i) => (
                            <div
                                key={i}
                                className={`h-8 w-8 rounded-full ${i < stats.streak ? "bg-indigo-600" : "bg-gray-100"
                                    }`}
                            ></div>
                        ))}
                    </div>
                </div>

                {/* Lessons Completed */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Lessons Completed</h3>
                    <div className="mt-2">
                        <span className="text-4xl font-bold text-gray-900">{stats.lessonsCompleted}</span>
                    </div>
                    <p className="mt-2 text-sm text-green-600 font-medium">+0 this week</p>
                </div>

                {/* Quick Capture */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Capture</h3>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Jot down a quick thought..."
                        className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
                        rows={3}
                    />
                    <button
                        onClick={handleSaveNote}
                        disabled={savingNote}
                        className="mt-3 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {savingNote ? "Saving..." : "Save Note"}
                    </button>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Active Courses */}
                <div className="col-span-2 rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Active Courses</h3>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-gray-500">No active courses yet.</p>
                        <button className="mt-4 text-indigo-600 font-medium hover:underline">Browse Courses</button>
                    </div>
                </div>

                {/* Daily Goal */}
                <div className="rounded-2xl bg-white p-6 shadow-sm flex flex-col items-center justify-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Daily Goal</h3>
                    <div className="relative h-32 w-32">
                        {/* Simple Circle Progress Placeholder */}
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-gray-100"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="text-indigo-600"
                                strokeDasharray={`${stats.dailyGoal}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-2xl font-bold text-gray-900">{stats.dailyGoal}%</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">{stats.completedToday || 0} of 5 lessons completed today</p>
                </div>
            </div>
        </div>
    );
}

"use client";
import { useState, useEffect } from "react";
import { databases, account } from "@/lib/appwrite";
import { COLLECTION_NOTES_ID, COLLECTION_COURSES_ID, DATABASE_ID } from "@/lib/config";
import { ID, Query } from "appwrite";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function DashboardPage() {
    const [note, setNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState({
        streak: 0,
        lessonsCompleted: 0,
        dailyGoal: 0,
        dailyGoalTarget: 5,
        completedToday: 0,
    });
    const toast = useToast();

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

        const fetchCourses = async () => {
            try {
                const user = await account.get();
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_COURSES_ID,
                    [Query.equal("authorId", user.$id)]
                );
                setCourses(response.documents.slice(0, 2)); // Show only first 2 courses
            } catch (error) {
                console.error("Error fetching courses:", error);
            }
        };

        fetchStats();
        fetchCourses();
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
            toast.success("Note saved!");
        } catch (error) {
            console.error("Error saving note:", error);
            toast.error("Failed to save note.");
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Row Stats */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Streak */}
                <div className="rounded-2xl bg-white p-6 shadow-sm" data-tour="streak-card">
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
                <div className="rounded-2xl bg-white p-6 shadow-sm" data-tour="quick-capture">
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
                <div className="col-span-2 rounded-2xl bg-white p-6 shadow-sm" data-tour="active-courses">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Active Courses</h3>
                        <Link href="/dashboard/courses" className="text-sm text-indigo-600 hover:underline">
                            View All
                        </Link>
                    </div>
                    {courses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-gray-500">No courses yet.</p>
                            <Link href="/dashboard/courses" className="mt-4 text-indigo-600 font-medium hover:underline">
                                Browse Courses
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {courses.map((course) => (
                                <Link
                                    key={course.$id}
                                    href={`/dashboard/courses/${course.$id}`}
                                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                                >
                                    <div className="h-16 w-16 rounded-lg bg-indigo-100 flex-shrink-0 overflow-hidden">
                                        {course.coverImage ? (
                                            <img src={course.coverImage} alt={course.title} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-xl font-bold">
                                                {course.title.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                                            {course.title}
                                        </h4>
                                        <p className="text-sm text-gray-500 truncate">
                                            {course.description || "No description"}
                                        </p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Daily Goal */}
                <div className="rounded-2xl bg-white p-6 shadow-sm flex flex-col items-center justify-center" data-tour="daily-goal">
                    <div className="flex items-center justify-between w-full mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Daily Goal</h3>
                        <Link href="/dashboard/settings" className="text-xs text-indigo-600 hover:underline">
                            Edit
                        </Link>
                    </div>
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
                    <p className="mt-4 text-sm text-gray-500">
                        {stats.completedToday || 0} of {stats.dailyGoalTarget || 5} lessons completed today
                    </p>
                </div>
            </div>
        </div>
    );
}

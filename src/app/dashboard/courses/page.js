"use client";
import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { COLLECTION_COURSES_ID, DATABASE_ID } from "@/lib/config";
import Link from "next/link";

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await databases.listDocuments(DATABASE_ID, COLLECTION_COURSES_ID);
                setCourses(response.documents);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    if (loading) return <div>Loading courses...</div>;

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl font-bold text-gray-900">All Courses</h1>
                <Link
                    href="/dashboard/courses/create"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 w-full sm:w-auto text-center"
                >
                    Create New Course
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                    <Link key={course.$id} href={`/dashboard/courses/${course.$id}`} className="group block relative">
                        <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md border border-gray-100">
                            <div className="aspect-video w-full bg-gray-200 relative">
                                {course.coverImage ? (
                                    <img src={course.coverImage} alt={course.title} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-50 text-indigo-200">
                                        <span className="text-4xl font-bold opacity-50">{course.title.charAt(0)}</span>
                                    </div>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.location.href = `/dashboard/courses/create/${course.$id}`;
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-gray-600 hover:text-indigo-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                                    title="Edit Course"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                    </svg>
                                </button>
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                    {course.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                                    {course.description || "No description provided."}
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-400">
                                    <span>{new Date(course.$createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

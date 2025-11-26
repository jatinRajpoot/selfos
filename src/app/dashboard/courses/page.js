"use client";
import Image from "next/image";
import Link from "next/link";
import { useCourses } from "@/hooks";
import { CourseCardSkeleton } from "@/components/Skeleton";

export default function CoursesPage() {
    const { courses, isLoading: loading } = useCourses();

    if (loading) {
        return (
            <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">All Courses</h1>
                    <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <CourseCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl font-bold text-gray-900">All Courses</h1>
                <Link
                    href="/dashboard/courses/create"
                    data-tour="create-course-btn"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 w-full sm:w-auto text-center"
                >
                    Create New Course
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                        <div className="mx-auto w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                            <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
                        <p className="text-gray-500 mb-6">Create your first course to start learning.</p>
                        <Link
                            href="/dashboard/courses/create"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Your First Course
                        </Link>
                    </div>
                ) : (
                    courses.map((course) => (
                    <Link key={course.$id} href={`/dashboard/courses/${course.$id}`} className="group block relative">
                        <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md border border-gray-100">
                            <div className="aspect-video w-full bg-gray-200 relative">
                                {course.coverImage ? (
                                    <Image
                                        src={course.coverImage}
                                        alt={course.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover"
                                        unoptimized
                                    />
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
                                    className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-gray-600 hover:text-indigo-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                                    aria-label={`Edit ${course.title}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                    ))
                )}
            </div>
        </div>
    );
}

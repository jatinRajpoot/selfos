"use client";
import { CourseCardSkeleton } from "@/components/Skeleton";

export default function CoursesLoading() {
    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
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

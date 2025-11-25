"use client";

export function Skeleton({ className = "", ...props }) {
    return (
        <div
            className={`animate-pulse bg-gray-200 rounded ${className}`}
            {...props}
        />
    );
}

export function CourseCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
            <Skeleton className="aspect-video w-full" />
            <div className="p-5 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/4 mt-4" />
            </div>
        </div>
    );
}

export function NoteCardSkeleton() {
    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-10 w-16 mb-4" />
            <div className="flex gap-1">
                {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-8 rounded-full" />
                ))}
            </div>
        </div>
    );
}

export function CourseListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100">
                    <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function CourseSyllabusSkeleton() {
    return (
        <div className="space-y-6 p-4">
            {[...Array(3)].map((_, i) => (
                <div key={i}>
                    <Skeleton className="h-3 w-32 mb-3" />
                    <div className="space-y-1">
                        {[...Array(4)].map((_, j) => (
                            <div key={j} className="flex items-center gap-3 p-2">
                                <Skeleton className="h-5 w-5 rounded-full" />
                                <Skeleton className="h-4 flex-1" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

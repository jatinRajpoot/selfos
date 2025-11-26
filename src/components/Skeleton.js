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

export function CoursePlayerSkeleton() {
    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)] overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden order-1 lg:order-2">
                {/* Header */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-8 bg-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <div>
                            <Skeleton className="h-3 w-20 mb-1" />
                            <Skeleton className="h-5 w-40" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>

                {/* Content */}
                <div className="flex-1 p-4 md:p-8">
                    <div className="max-w-4xl mx-auto">
                        <Skeleton className="aspect-video w-full rounded-xl mb-8" />
                        <div className="flex justify-between mb-8">
                            <Skeleton className="h-10 w-24 rounded-lg" />
                            <Skeleton className="h-10 w-24 rounded-lg" />
                        </div>
                        <div className="flex gap-8 mb-6 border-b border-gray-200 pb-4">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-20" />
                        </div>
                        <Skeleton className="h-40 w-full rounded-xl" />
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-r border-gray-200 bg-gray-50 flex-shrink-0 order-2 lg:order-1 h-96 lg:h-auto">
                <div className="p-4 border-b border-gray-200">
                    <Skeleton className="h-6 w-32" />
                </div>
                <CourseSyllabusSkeleton />
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>
            
            {/* Recent Courses */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <CourseListSkeleton />
            </div>
        </div>
    );
}

"use client";
import { NoteCardSkeleton } from "@/components/Skeleton";

export default function NotesLoading() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex gap-4">
                    <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
                </div>
            </div>

            {/* Quick Capture */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="h-24 w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <NoteCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

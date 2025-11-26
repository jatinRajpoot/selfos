"use client";
import useSWR from "swr";
import { useMemo } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
    DATABASE_ID,
    COLLECTION_COURSES_ID,
    COLLECTION_CHAPTERS_ID,
    COLLECTION_PROGRESS_ID,
    COLLECTION_RESOURCES_ID,
} from "@/lib/config";
import { useUser } from "./useUser";

// Fetcher for user's courses
const coursesFetcher = async ([, userId]) => {
    if (!userId) return [];
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_COURSES_ID, [
        Query.equal("authorId", userId),
        Query.orderDesc("$createdAt"),
    ]);
    return response.documents;
};

// Fetcher for a single course with all related data (chapters, resources)
const courseDetailFetcher = async ([, courseId, userId]) => {
    if (!courseId || !userId) return null;

    // Fetch course and chapters in parallel
    const [courseRes, chaptersRes] = await Promise.all([
        databases.getDocument(DATABASE_ID, COLLECTION_COURSES_ID, courseId),
        databases.listDocuments(DATABASE_ID, COLLECTION_CHAPTERS_ID, [
            Query.equal("courseId", courseId),
            Query.orderAsc("order"),
            Query.limit(100),
        ]),
    ]);

    const chapterIds = chaptersRes.documents.map((c) => c.$id);

    if (chapterIds.length === 0) {
        return {
            course: courseRes,
            chapters: [],
            progress: [],
            progressMap: {},
        };
    }

    // Fetch resources and progress in parallel
    const [resourcesRes, progressRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTION_RESOURCES_ID, [
            Query.equal("chapterId", chapterIds),
            Query.limit(500),
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTION_PROGRESS_ID, [
            Query.equal("userId", userId),
            Query.equal("chapterId", chapterIds),
            Query.limit(500),
        ]),
    ]);

    // Group resources by chapter
    const resourcesByChapter = {};
    resourcesRes.documents.forEach((resource) => {
        if (!resourcesByChapter[resource.chapterId]) {
            resourcesByChapter[resource.chapterId] = [];
        }
        resourcesByChapter[resource.chapterId].push(resource);
    });

    // Build chapters with resources
    const chaptersWithResources = chaptersRes.documents.map((chapter) => ({
        ...chapter,
        resources: resourcesByChapter[chapter.$id] || [],
    }));

    // Create progress lookup
    const progressMap = {};
    progressRes.documents.forEach((p) => {
        progressMap[p.chapterId] = p;
    });

    return {
        course: courseRes,
        chapters: chaptersWithResources,
        progress: progressRes.documents,
        progressMap,
    };
};

// Stable empty arrays/objects to prevent reference changes
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

// Hook for fetching user's courses list
export function useCourses() {
    const { user, isLoading: userLoading } = useUser();

    const { data, error, isLoading, mutate } = useSWR(
        user ? ["courses", user.$id] : null,
        coursesFetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000, // Cache for 30 seconds
        }
    );

    return {
        courses: data || EMPTY_ARRAY,
        isLoading: userLoading || isLoading,
        error,
        mutate,
    };
}

// Hook for fetching a single course with all details
export function useCourse(courseId) {
    const { user, isLoading: userLoading } = useUser();

    const { data, error, isLoading, mutate } = useSWR(
        user && courseId ? ["course", courseId, user.$id] : null,
        courseDetailFetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    );

    // Memoize the return values to prevent unnecessary re-renders
    const course = data?.course || null;
    const chapters = data?.chapters || EMPTY_ARRAY;
    const progress = data?.progress || EMPTY_ARRAY;
    const progressMap = data?.progressMap || EMPTY_OBJECT;

    return {
        course,
        chapters,
        progress,
        progressMap,
        isLoading: userLoading || isLoading,
        error,
        mutate,
    };
}

// Hook for just course data (for editor)
export function useCourseEditor(courseId) {
    const { user, isLoading: userLoading } = useUser();

    const fetcher = async ([, cid]) => {
        if (!cid) return null;

        // Fetch course, chapters in parallel
        const [courseRes, chaptersRes] = await Promise.all([
            databases.getDocument(DATABASE_ID, COLLECTION_COURSES_ID, cid),
            databases.listDocuments(DATABASE_ID, COLLECTION_CHAPTERS_ID, [
                Query.equal("courseId", cid),
                Query.orderAsc("order"),
                Query.limit(100),
            ]),
        ]);

        const chapterIds = chaptersRes.documents.map((c) => c.$id);

        if (chapterIds.length === 0) {
            return {
                course: courseRes,
                chapters: [],
            };
        }

        // Fetch resources
        const resourcesRes = await databases.listDocuments(DATABASE_ID, COLLECTION_RESOURCES_ID, [
            Query.equal("chapterId", chapterIds),
            Query.limit(500),
        ]);

        // Group resources by chapter
        const resourcesByChapter = {};
        resourcesRes.documents.forEach((resource) => {
            if (!resourcesByChapter[resource.chapterId]) {
                resourcesByChapter[resource.chapterId] = [];
            }
            resourcesByChapter[resource.chapterId].push(resource);
        });

        // Build chapters with resources
        const chaptersWithResources = chaptersRes.documents.map((chapter) => ({
            ...chapter,
            resources: resourcesByChapter[chapter.$id] || [],
        }));

        return {
            course: courseRes,
            chapters: chaptersWithResources,
        };
    };

    const { data, error, isLoading, mutate } = useSWR(
        courseId ? ["course-editor", courseId] : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 10000,
        }
    );

    return {
        course: data?.course || null,
        chapters: data?.chapters || EMPTY_ARRAY,
        isLoading: userLoading || isLoading,
        error,
        mutate,
    };
}

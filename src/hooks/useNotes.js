"use client";
import useSWR from "swr";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
    DATABASE_ID,
    COLLECTION_NOTES_ID,
    COLLECTION_IMAGE_NOTES_ID,
    COLLECTION_COURSES_ID,
    COLLECTION_CHAPTERS_ID,
} from "@/lib/config";
import { useUser } from "./useUser";

// Fetcher for user's notes with related course/chapter data
const notesFetcher = async ([, userId]) => {
    if (!userId) return { notes: [], imageNotes: [], courses: [], chapters: [] };

    // Fetch all user data in parallel
    const [notesRes, imageNotesRes, coursesRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTION_NOTES_ID, [
            Query.equal("userId", userId),
            Query.orderDesc("$updatedAt"),
            Query.limit(500),
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTION_IMAGE_NOTES_ID, [
            Query.equal("userId", userId),
            Query.orderDesc("$createdAt"),
            Query.limit(500),
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTION_COURSES_ID, [
            Query.equal("authorId", userId),
            Query.limit(100),
        ]),
    ]);

    const courseIds = coursesRes.documents.map((c) => c.$id);

    if (courseIds.length === 0) {
        return {
            notes: notesRes.documents,
            imageNotes: imageNotesRes.documents,
            courses: [],
            chapters: [],
        };
    }

    // Fetch chapters for user's courses
    const chaptersRes = await databases.listDocuments(DATABASE_ID, COLLECTION_CHAPTERS_ID, [
        Query.equal("courseId", courseIds),
        Query.limit(500),
    ]);

    return {
        notes: notesRes.documents,
        imageNotes: imageNotesRes.documents,
        courses: coursesRes.documents,
        chapters: chaptersRes.documents,
    };
};

export function useNotes() {
    const { user, isLoading: userLoading } = useUser();

    const { data, error, isLoading, mutate } = useSWR(
        user ? ["notes", user.$id] : null,
        notesFetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    );

    return {
        notes: data?.notes || [],
        imageNotes: data?.imageNotes || [],
        courses: data?.courses || [],
        chapters: data?.chapters || [],
        isLoading: userLoading || isLoading,
        error,
        mutate,
    };
}

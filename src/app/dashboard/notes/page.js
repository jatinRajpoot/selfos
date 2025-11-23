"use client";
import { useState, useEffect } from "react";
import { databases, account } from "@/lib/appwrite";
import { COLLECTION_NOTES_ID, DATABASE_ID } from "@/lib/config";
import { Query } from "appwrite";

export default function NotesPage() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const user = await account.get();
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_NOTES_ID,
                    [Query.equal("userId", user.$id)]
                );
                setNotes(response.documents);
            } catch (error) {
                console.error("Error fetching notes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, []);

    if (loading) {
        return <div>Loading notes...</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Notes</h1>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notes.length === 0 ? (
                    <p className="text-gray-500">No notes found.</p>
                ) : (
                    notes.map((note) => (
                        <div key={note.$id} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-xs font-medium uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                    {note.courseId === "quick-capture" ? "Quick Capture" : "Course Note"}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {new Date(note.$createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap line-clamp-6">{note.content}</p>
                            {note.courseId !== "quick-capture" && (
                                <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500">
                                    <p>Course: {note.courseId}</p>
                                    <p>Chapter: {note.chapterId}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

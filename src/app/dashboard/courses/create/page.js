"use client";
import { useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { COLLECTION_COURSES_ID, DATABASE_ID } from "@/lib/config";
import { ID } from "appwrite";
import { useRouter } from "next/navigation";

export default function CreateCoursePage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await account.get();
            const course = await databases.createDocument(
                DATABASE_ID,
                COLLECTION_COURSES_ID,
                ID.unique(),
                {
                    title,
                    description,
                    coverImage,
                    authorId: user.$id,
                }
            );
            router.push(`/dashboard/courses/create/${course.$id}`);
        } catch (error) {
            console.error("Error creating course:", error);
            alert("Failed to create course.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Course</h1>
            <div className="bg-white rounded-xl shadow-sm p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                            placeholder="e.g., Advanced UX Design"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                            rows={4}
                            placeholder="What will students learn?"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image URL</label>
                        <input
                            type="url"
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Course"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

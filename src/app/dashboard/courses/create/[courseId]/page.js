"use client";
import { useState, useEffect, use } from "react";
import { databases } from "@/lib/appwrite";
import { COLLECTION_COURSES_ID, COLLECTION_CHAPTERS_ID, COLLECTION_TOPICS_ID, DATABASE_ID } from "@/lib/config";
import { ID, Query } from "appwrite";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function CourseEditorPage({ params }) {
    const { courseId } = use(params);
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newChapterTitle, setNewChapterTitle] = useState("");
    const [addingChapter, setAddingChapter] = useState(false);

    // Topic State
    const [activeChapterId, setActiveChapterId] = useState(null);
    const [newTopic, setNewTopic] = useState({ title: "", type: "video", content: "", videoUrl: "" });
    const [addingTopic, setAddingTopic] = useState(false);

    // Confirm Dialog State
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, [courseId]);

    const fetchData = async () => {
        try {
            const courseData = await databases.getDocument(DATABASE_ID, COLLECTION_COURSES_ID, courseId);
            setCourse(courseData);

            const chaptersData = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_CHAPTERS_ID,
                [Query.equal("courseId", courseId), Query.orderAsc("order")]
            );

            const chaptersWithTopics = await Promise.all(chaptersData.documents.map(async (chapter) => {
                const topicsData = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_TOPICS_ID,
                    [Query.equal("chapterId", chapter.$id), Query.orderAsc("order")]
                );
                return { ...chapter, topics: topicsData.documents };
            }));

            setChapters(chaptersWithTopics);
        } catch (error) {
            console.error("Error fetching course data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChapter = async (e) => {
        e.preventDefault();
        if (!newChapterTitle.trim()) return;
        setAddingChapter(true);
        try {
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_CHAPTERS_ID,
                ID.unique(),
                {
                    courseId,
                    title: newChapterTitle,
                    order: chapters.length + 1,
                }
            );
            setNewChapterTitle("");
            fetchData(); // Refresh
        } catch (error) {
            console.error("Error adding chapter:", error);
        } finally {
            setAddingChapter(false);
        }
    };

    const handleAddTopic = async (e) => {
        e.preventDefault();
        if (!newTopic.title.trim() || !activeChapterId) return;
        setAddingTopic(true);
        try {
            const chapter = chapters.find(c => c.$id === activeChapterId);
            const order = chapter ? chapter.topics.length + 1 : 1;

            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_TOPICS_ID,
                ID.unique(),
                {
                    chapterId: activeChapterId,
                    title: newTopic.title,
                    type: newTopic.type,
                    content: newTopic.content,
                    videoUrl: newTopic.videoUrl,
                    order: order
                }
            );
            setNewTopic({ title: "", type: "video", content: "", videoUrl: "" });
            setActiveChapterId(null);
            fetchData();
        } catch (error) {
            console.error("Error adding topic:", error);
        } finally {
            setAddingTopic(false);
        }
    };

    const handleDeleteCourse = () => {
        setConfirmDialog({
            isOpen: true,
            title: "Delete Course",
            message: "Are you sure you want to delete this course? This action cannot be undone.",
            onConfirm: async () => {
                try {
                    await databases.deleteDocument(DATABASE_ID, COLLECTION_COURSES_ID, courseId);
                    router.push("/dashboard/courses");
                } catch (error) {
                    console.error("Error deleting course:", error);
                    alert("Failed to delete course");
                } finally {
                    setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null });
                }
            }
        });
    };

    const handleDeleteChapter = (chapterId) => {
        setConfirmDialog({
            isOpen: true,
            title: "Delete Chapter",
            message: "Delete this chapter and all its topics? This action cannot be undone.",
            onConfirm: async () => {
                try {
                    await databases.deleteDocument(DATABASE_ID, COLLECTION_CHAPTERS_ID, chapterId);
                    fetchData();
                } catch (error) {
                    console.error("Error deleting chapter:", error);
                } finally {
                    setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null });
                }
            }
        });
    };

    const handleDeleteTopic = (topicId) => {
        setConfirmDialog({
            isOpen: true,
            title: "Delete Topic",
            message: "Are you sure you want to delete this topic?",
            onConfirm: async () => {
                try {
                    await databases.deleteDocument(DATABASE_ID, COLLECTION_TOPICS_ID, topicId);
                    fetchData();
                } catch (error) {
                    console.error("Error deleting topic:", error);
                } finally {
                    setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null });
                }
            }
        });
    };

    if (loading) return <div>Loading...</div>;
    if (!course) return <div>Course not found</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{course.title}</h1>
                    <p className="text-gray-500 mt-1">Curriculum Editor</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={handleDeleteCourse}
                        className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-center"
                    >
                        Delete Course
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/courses/${courseId}`)}
                        className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-center"
                    >
                        View Course
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {chapters.map((chapter) => (
                    <div key={chapter.$id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-4 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-500 hidden sm:inline">{chapter.topics.length} topics</span>
                                <button
                                    onClick={() => handleDeleteChapter(chapter.$id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete Chapter"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-4 md:p-6 space-y-4">
                            {chapter.topics.map((topic) => (
                                <div key={topic.$id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white hover:border-indigo-100 transition-colors group">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {topic.type === 'video' ? 'V' : topic.type === 'text' ? 'T' : 'L'}
                                        </div>
                                        <span className="font-medium text-gray-700 truncate">{topic.title}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteTopic(topic.$id)}
                                        className="text-gray-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-all ml-2"
                                        title="Delete Topic"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ))}

                            {/* Add Topic Form */}
                            {activeChapterId === chapter.$id ? (
                                <form onSubmit={handleAddTopic} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">Add New Topic</h4>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Topic Title"
                                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                            value={newTopic.title}
                                            onChange={e => setNewTopic({ ...newTopic, title: e.target.value })}
                                            required
                                        />
                                        <select
                                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                            value={newTopic.type}
                                            onChange={e => setNewTopic({ ...newTopic, type: e.target.value })}
                                        >
                                            <option value="video">Video</option>
                                            <option value="youtube">YouTube</option>
                                            <option value="text">Text/Article</option>
                                        </select>

                                        {(newTopic.type === 'video' || newTopic.type === 'youtube') && (
                                            <input
                                                type="url"
                                                placeholder="Video URL"
                                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                                value={newTopic.videoUrl}
                                                onChange={e => setNewTopic({ ...newTopic, videoUrl: e.target.value })}
                                            />
                                        )}

                                        {newTopic.type === 'text' && (
                                            <textarea
                                                placeholder="Content (Markdown supported)"
                                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                                rows={3}
                                                value={newTopic.content}
                                                onChange={e => setNewTopic({ ...newTopic, content: e.target.value })}
                                            />
                                        )}

                                        <div className="flex gap-2 justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setActiveChapterId(null)}
                                                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={addingTopic}
                                                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                Add Topic
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setActiveChapterId(chapter.$id)}
                                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
                                >
                                    + Add Topic
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add Chapter Form */}
                <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
                    <form onSubmit={handleAddChapter} className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="New Chapter Title"
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                            value={newChapterTitle}
                            onChange={(e) => setNewChapterTitle(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            disabled={addingChapter}
                            className="rounded-lg bg-gray-900 px-6 py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-50 w-full md:w-auto"
                        >
                            Add Chapter
                        </button>
                    </form>
                </div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null })}
            />
        </div>
    );
}

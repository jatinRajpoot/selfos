"use client";
import { useState, useEffect, use } from "react";
import { databases } from "@/lib/appwrite";
import { COLLECTION_COURSES_ID, COLLECTION_CHAPTERS_ID, COLLECTION_PROGRESS_ID, COLLECTION_NOTES_ID, COLLECTION_RESOURCES_ID, DATABASE_ID } from "@/lib/config";
import { ID, Query } from "appwrite";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { FileText, Link as LinkIcon, Youtube, MessageSquare, Sparkles, File, Plus, X, ExternalLink } from "lucide-react";

export default function CourseEditorPage({ params }) {
    const { courseId } = use(params);
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newChapterTitle, setNewChapterTitle] = useState("");
    const [addingChapter, setAddingChapter] = useState(false);

    // Resource State (now at chapter level)
    const [activeChapterForResources, setActiveChapterForResources] = useState(null);
    const [chapterResources, setChapterResources] = useState({});
    const [newResource, setNewResource] = useState({ name: "", type: "webpage", url: "" });
    const [addingResource, setAddingResource] = useState(false);

    // Confirm Dialog State
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

    const router = useRouter();
    const toast = useToast();

    // Get resource icon based on type
    const getResourceIcon = (type) => {
        switch (type) {
            case 'pdf':
                return <FileText className="w-4 h-4 text-red-500" />;
            case 'youtube':
                return <Youtube className="w-4 h-4 text-red-600" />;
            case 'chatgpt':
                return <MessageSquare className="w-4 h-4 text-green-600" />;
            case 'gemini':
                return <Sparkles className="w-4 h-4 text-blue-500" />;
            case 'webpage':
                return <LinkIcon className="w-4 h-4 text-indigo-500" />;
            default:
                return <File className="w-4 h-4 text-gray-500" />;
        }
    };

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

            setChapters(chaptersData.documents);
            
            // Fetch resources for all chapters
            const resourcesMap = {};
            for (const chapter of chaptersData.documents) {
                try {
                    const resourcesData = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTION_RESOURCES_ID,
                        [Query.equal("chapterId", chapter.$id)]
                    );
                    resourcesMap[chapter.$id] = resourcesData.documents;
                } catch (e) {
                    resourcesMap[chapter.$id] = [];
                }
            }
            setChapterResources(resourcesMap);
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
            toast.success("Chapter added!");
        } catch (error) {
            console.error("Error adding chapter:", error);
            toast.error("Failed to add chapter");
        } finally {
            setAddingChapter(false);
        }
    };

    const handleAddResource = async (e) => {
        e.preventDefault();
        if (!newResource.name.trim() || !newResource.url.trim() || !activeChapterForResources) return;
        setAddingResource(true);
        try {
            const created = await databases.createDocument(
                DATABASE_ID,
                COLLECTION_RESOURCES_ID,
                ID.unique(),
                {
                    chapterId: activeChapterForResources,
                    name: newResource.name,
                    type: newResource.type,
                    url: newResource.url,
                }
            );
            // Update local state
            setChapterResources(prev => ({
                ...prev,
                [activeChapterForResources]: [...(prev[activeChapterForResources] || []), created]
            }));
            setNewResource({ name: "", type: "webpage", url: "" });
            toast.success("Resource added!");
        } catch (error) {
            console.error("Error adding resource:", error);
            toast.error("Failed to add resource");
        } finally {
            setAddingResource(false);
        }
    };

    const handleDeleteResource = async (resourceId, chapterId) => {
        try {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_RESOURCES_ID, resourceId);
            setChapterResources(prev => ({
                ...prev,
                [chapterId]: prev[chapterId].filter(r => r.$id !== resourceId)
            }));
            toast.success("Resource deleted!");
        } catch (error) {
            console.error("Error deleting resource:", error);
            toast.error("Failed to delete resource");
        }
    };

    const handleDeleteCourse = () => {
        setConfirmDialog({
            isOpen: true,
            title: "Delete Course",
            message: "Are you sure you want to delete this course? This will also delete all chapters, progress, notes, and resources. This action cannot be undone.",
            onConfirm: async () => {
                try {
                    // Cascade delete: Delete all related data first
                    // 1. Get all chapters for this course
                    const chaptersData = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTION_CHAPTERS_ID,
                        [Query.equal("courseId", courseId)]
                    );

                    // 2. For each chapter, delete progress and resources
                    for (const chapter of chaptersData.documents) {
                        // Delete progress for this chapter
                        const progressData = await databases.listDocuments(
                            DATABASE_ID,
                            COLLECTION_PROGRESS_ID,
                            [Query.equal("chapterId", chapter.$id)]
                        );
                        for (const progress of progressData.documents) {
                            await databases.deleteDocument(DATABASE_ID, COLLECTION_PROGRESS_ID, progress.$id);
                        }

                        // Delete resources for this chapter
                        const resourcesData = await databases.listDocuments(
                            DATABASE_ID,
                            COLLECTION_RESOURCES_ID,
                            [Query.equal("chapterId", chapter.$id)]
                        );
                        for (const resource of resourcesData.documents) {
                            await databases.deleteDocument(DATABASE_ID, COLLECTION_RESOURCES_ID, resource.$id);
                        }

                        // Delete the chapter
                        await databases.deleteDocument(DATABASE_ID, COLLECTION_CHAPTERS_ID, chapter.$id);
                    }

                    // 3. Delete all notes for this course
                    const notesData = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTION_NOTES_ID,
                        [Query.equal("courseId", courseId)]
                    );
                    for (const note of notesData.documents) {
                        await databases.deleteDocument(DATABASE_ID, COLLECTION_NOTES_ID, note.$id);
                    }

                    // 4. Finally delete the course
                    await databases.deleteDocument(DATABASE_ID, COLLECTION_COURSES_ID, courseId);
                    
                    toast.success("Course deleted successfully");
                    router.push("/dashboard/courses");
                } catch (error) {
                    console.error("Error deleting course:", error);
                    toast.error("Failed to delete course");
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
            message: "Delete this chapter and all its resources? This action cannot be undone.",
            onConfirm: async () => {
                try {
                    // Delete progress for this chapter
                    const progressData = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTION_PROGRESS_ID,
                        [Query.equal("chapterId", chapterId)]
                    );
                    for (const progress of progressData.documents) {
                        await databases.deleteDocument(DATABASE_ID, COLLECTION_PROGRESS_ID, progress.$id);
                    }

                    // Delete resources for this chapter
                    const resourcesData = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTION_RESOURCES_ID,
                        [Query.equal("chapterId", chapterId)]
                    );
                    for (const resource of resourcesData.documents) {
                        await databases.deleteDocument(DATABASE_ID, COLLECTION_RESOURCES_ID, resource.$id);
                    }
                    
                    await databases.deleteDocument(DATABASE_ID, COLLECTION_CHAPTERS_ID, chapterId);
                    toast.success("Chapter deleted successfully");
                    fetchData();
                } catch (error) {
                    console.error("Error deleting chapter:", error);
                    toast.error("Failed to delete chapter");
                } finally {
                    setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null });
                }
            }
        });
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    if (!course) return <div>Course not found</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{course.title}</h1>
                    <p className="text-gray-500 mt-1">Course Editor</p>
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

            <div className="space-y-4">
                {chapters.map((chapter, index) => (
                    <div key={chapter.$id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 md:px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
                                    {index + 1}
                                </div>
                                <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 hidden sm:inline">
                                    {(chapterResources[chapter.$id] || []).length} resources
                                </span>
                                <button
                                    onClick={() => setActiveChapterForResources(activeChapterForResources === chapter.$id ? null : chapter.$id)}
                                    className={`p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all ${activeChapterForResources === chapter.$id ? 'text-indigo-600 bg-indigo-50' : ''}`}
                                    title="Manage Resources"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteChapter(chapter.$id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete Chapter"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>

                        {/* Resources Section */}
                        {activeChapterForResources === chapter.$id && (
                            <div className="border-t border-gray-100 p-4 bg-gray-50">
                                <h5 className="text-xs font-bold uppercase text-gray-500 mb-3">Resources</h5>
                                
                                {/* Existing Resources */}
                                {(chapterResources[chapter.$id] || []).length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {(chapterResources[chapter.$id] || []).map((resource) => (
                                            <div key={resource.$id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    {getResourceIcon(resource.type)}
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-700">{resource.name}</span>
                                                        <span className="text-xs text-gray-400 ml-2 capitalize">({resource.type})</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={resource.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 text-gray-400 hover:text-indigo-600"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                    <button
                                                        onClick={() => handleDeleteResource(resource.$id, chapter.$id)}
                                                        className="p-1 text-gray-300 hover:text-red-500"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Add Resource Form */}
                                <form onSubmit={handleAddResource} className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Resource name"
                                            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                                            value={newResource.name}
                                            onChange={e => setNewResource({ ...newResource, name: e.target.value })}
                                            required
                                        />
                                        <select
                                            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                                            value={newResource.type}
                                            onChange={e => setNewResource({ ...newResource, type: e.target.value })}
                                        >
                                            <option value="webpage">Webpage</option>
                                            <option value="pdf">PDF</option>
                                            <option value="youtube">YouTube</option>
                                            <option value="chatgpt">ChatGPT Link</option>
                                            <option value="gemini">Gemini Link</option>
                                            <option value="file">Other File</option>
                                        </select>
                                        <input
                                            type="url"
                                            placeholder="URL"
                                            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                                            value={newResource.url}
                                            onChange={e => setNewResource({ ...newResource, url: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={addingResource}
                                        className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {addingResource ? "Adding..." : "Add Resource"}
                                    </button>
                                </form>
                            </div>
                        )}
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

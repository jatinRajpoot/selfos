"use client";
import { useState, useEffect, use, useCallback } from "react";
import { databases, account, storage } from "@/lib/appwrite";
import { COLLECTION_COURSES_ID, COLLECTION_CHAPTERS_ID, COLLECTION_PROGRESS_ID, COLLECTION_NOTES_ID, COLLECTION_RESOURCES_ID, COLLECTION_IMAGE_NOTES_ID, DATABASE_ID, RESOURCE_TYPES, BUCKET_ID } from "@/lib/config";
import { ID, Query } from "appwrite";
import { useToast } from "@/components/Toast";
import { ChevronDown, ChevronRight, FileText, Link as LinkIcon, Youtube, MessageSquare, Sparkles, File, ExternalLink, ImageIcon, Trash2Icon, CheckCircle2, Circle, StickyNote, BookOpen } from "lucide-react";
import ImageNotesUploader, { ImageNoteViewer, ImageNoteCard } from "@/components/ImageNotesUploader";
import { useUser } from "@/hooks";
import { CoursePlayerSkeleton } from "@/components/Skeleton";
import Link from "next/link";

export default function CourseDetailPage({ params }) {
    const { courseId } = use(params);
    const { user } = useUser();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedChapter, setExpandedChapter] = useState(null);
    const [activeTab, setActiveTab] = useState("notes"); // notes, images, resources
    const [noteContent, setNoteContent] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [markingComplete, setMarkingComplete] = useState(null);
    const [completedChapters, setCompletedChapters] = useState(new Set());
    const [chapterResources, setChapterResources] = useState({});
    const [chapterImageNotes, setChapterImageNotes] = useState({});
    const [viewingImageNote, setViewingImageNote] = useState(null);
    const toast = useToast();

    // Get resource icon based on type
    const getResourceIcon = (type) => {
        switch (type) {
            case RESOURCE_TYPES?.PDF:
            case 'pdf':
                return <FileText className="w-5 h-5 text-red-500" />;
            case RESOURCE_TYPES?.YOUTUBE:
            case 'youtube':
                return <Youtube className="w-5 h-5 text-red-600" />;
            case RESOURCE_TYPES?.CHATGPT:
            case 'chatgpt':
                return <MessageSquare className="w-5 h-5 text-green-600" />;
            case RESOURCE_TYPES?.GEMINI:
            case 'gemini':
                return <Sparkles className="w-5 h-5 text-blue-500" />;
            case RESOURCE_TYPES?.WEBPAGE:
            case 'webpage':
                return <LinkIcon className="w-5 h-5 text-indigo-500" />;
            default:
                return <File className="w-5 h-5 text-gray-500" />;
        }
    };

    // Fetch course data
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Fetch course
                const courseData = await databases.getDocument(DATABASE_ID, COLLECTION_COURSES_ID, courseId);
                setCourse(courseData);

                // Fetch chapters
                const chaptersData = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_CHAPTERS_ID,
                    [Query.equal("courseId", courseId), Query.orderAsc("order")]
                );
                setChapters(chaptersData.documents);

                // Fetch progress for chapters
                const progressData = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_PROGRESS_ID,
                    [Query.equal("userId", user.$id)]
                );
                const completedSet = new Set();
                progressData.documents.forEach(p => {
                    if (p.chapterId && p.status === "completed") {
                        completedSet.add(p.chapterId);
                    }
                });
                setCompletedChapters(completedSet);

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
        fetchData();
    }, [courseId, user]);

    // Fetch image notes when chapter is expanded
    useEffect(() => {
        const fetchImageNotes = async () => {
            if (!expandedChapter || !user) return;
            if (chapterImageNotes[expandedChapter]) return; // Already fetched
            
            try {
                const imageNotesData = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_IMAGE_NOTES_ID,
                    [
                        Query.equal("userId", user.$id),
                        Query.equal("chapterId", expandedChapter),
                        Query.orderDesc("$createdAt")
                    ]
                );
                setChapterImageNotes(prev => ({
                    ...prev,
                    [expandedChapter]: imageNotesData.documents
                }));
            } catch (error) {
                console.error("Error fetching image notes:", error);
                setChapterImageNotes(prev => ({
                    ...prev,
                    [expandedChapter]: []
                }));
            }
        };
        fetchImageNotes();
    }, [expandedChapter, user]);

    const handleChapterClick = (chapterId) => {
        if (expandedChapter === chapterId) {
            setExpandedChapter(null);
        } else {
            setExpandedChapter(chapterId);
            setActiveTab("notes");
            setNoteContent("");
        }
    };

    const handleMarkComplete = useCallback(async (chapterId) => {
        if (!user || markingComplete === chapterId) return;
        
        // Check if already completed locally
        if (completedChapters.has(chapterId)) return;
        
        setMarkingComplete(chapterId);
        try {
            // Check if progress already exists
            const existingProgress = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_PROGRESS_ID,
                [
                    Query.equal("userId", user.$id),
                    Query.equal("chapterId", chapterId),
                    Query.equal("status", "completed")
                ]
            );
            
            if (existingProgress.documents.length > 0) {
                setCompletedChapters(prev => new Set(prev).add(chapterId));
                toast.info("Chapter already marked as complete");
                return;
            }
            
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_PROGRESS_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    chapterId: chapterId,
                    status: "completed",
                    completedAt: new Date().toISOString(),
                }
            );
            setCompletedChapters(prev => new Set(prev).add(chapterId));
            toast.success("Chapter marked as complete!");
        } catch (error) {
            console.error("Error marking complete:", error);
            toast.error("Failed to mark chapter as complete");
        } finally {
            setMarkingComplete(null);
        }
    }, [user, completedChapters, toast, markingComplete]);

    const handleSaveNote = useCallback(async () => {
        if (!noteContent.trim() || !expandedChapter || !user) return;
        setSavingNote(true);
        try {
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_NOTES_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    courseId: courseId,
                    chapterId: expandedChapter,
                    content: noteContent,
                }
            );
            toast.success("Note saved!");
            setNoteContent("");
        } catch (error) {
            console.error("Error saving note:", error);
            toast.error("Failed to save note");
        } finally {
            setSavingNote(false);
        }
    }, [noteContent, expandedChapter, user, courseId, toast]);

    const handleImageNoteDelete = useCallback((deletedId) => {
        if (!expandedChapter) return;
        setChapterImageNotes(prev => ({
            ...prev,
            [expandedChapter]: (prev[expandedChapter] || []).filter(note => note.$id !== deletedId)
        }));
    }, [expandedChapter]);

    const handleImageUploadComplete = useCallback(async () => {
        if (!expandedChapter || !user) return;
        try {
            const imageNotesData = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_IMAGE_NOTES_ID,
                [
                    Query.equal("userId", user.$id),
                    Query.equal("chapterId", expandedChapter),
                    Query.orderDesc("$createdAt")
                ]
            );
            setChapterImageNotes(prev => ({
                ...prev,
                [expandedChapter]: imageNotesData.documents
            }));
        } catch (error) {
            console.error("Error refreshing image notes:", error);
        }
    }, [expandedChapter, user]);

    // Calculate progress
    const completedCount = chapters.filter(ch => completedChapters.has(ch.$id)).length;
    const progressPercent = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

    if (loading) return <CoursePlayerSkeleton />;
    if (!course && !loading) return (
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Course not found</h2>
                <p className="text-gray-500 mb-4">The course you're looking for doesn't exist or you don't have access to it.</p>
                <Link href="/dashboard/courses" className="text-indigo-600 hover:text-indigo-700 font-medium">← Back to courses</Link>
            </div>
        </div>
    );
    if (!course) return <CoursePlayerSkeleton />;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Course Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{course.title}</h1>
                        {course.description && (
                            <p className="text-gray-500 mt-2">{course.description}</p>
                        )}
                    </div>
                    <Link
                        href={`/dashboard/courses/create/${courseId}`}
                        className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-center"
                    >
                        Edit Course
                    </Link>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{completedCount} of {chapters.length} chapters completed</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Chapters List */}
            <div className="space-y-3">
                {chapters.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No chapters yet</h3>
                        <p className="text-gray-500 mb-4">Add chapters to start tracking your progress.</p>
                        <Link
                            href={`/dashboard/courses/create/${courseId}`}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Add Chapters
                        </Link>
                    </div>
                ) : (
                    chapters.map((chapter, index) => {
                        const isExpanded = expandedChapter === chapter.$id;
                        const isCompleted = completedChapters.has(chapter.$id);
                        const resources = chapterResources[chapter.$id] || [];
                        const imageNotes = chapterImageNotes[chapter.$id] || [];

                        return (
                            <div 
                                key={chapter.$id} 
                                className={`bg-white rounded-xl shadow-sm border transition-all ${isExpanded ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-100'}`}
                            >
                                {/* Chapter Header */}
                                <div 
                                    onClick={() => handleChapterClick(chapter.$id)}
                                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-xl"
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkComplete(chapter.$id);
                                        }}
                                        disabled={isCompleted || markingComplete === chapter.$id}
                                        className={`flex-shrink-0 transition-colors ${isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-indigo-500'}`}
                                        title={isCompleted ? "Completed" : "Mark as complete"}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-6 h-6" />
                                        ) : (
                                            <Circle className="w-6 h-6" />
                                        )}
                                    </button>
                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-semibold truncate ${isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>
                                            {chapter.title}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                            {resources.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <LinkIcon className="w-3 h-3" />
                                                    {resources.length} resources
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 p-4">
                                        {/* Tabs */}
                                        <div className="mb-4 border-b border-gray-200">
                                            <div className="flex gap-6">
                                                <button
                                                    onClick={() => setActiveTab("notes")}
                                                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === "notes" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <StickyNote className="w-4 h-4" />
                                                        Notes
                                                    </span>
                                                    {activeTab === "notes" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>}
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab("images")}
                                                    className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === "images" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                                                >
                                                    <ImageIcon className="w-4 h-4" />
                                                    Images
                                                    {imageNotes.length > 0 && (
                                                        <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                                                            {imageNotes.length}
                                                        </span>
                                                    )}
                                                    {activeTab === "images" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>}
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab("resources")}
                                                    className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === "resources" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                                                >
                                                    <LinkIcon className="w-4 h-4" />
                                                    Resources
                                                    {resources.length > 0 && (
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                                                            {resources.length}
                                                        </span>
                                                    )}
                                                    {activeTab === "resources" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Tab Content */}
                                        {activeTab === "notes" && (
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <textarea
                                                    value={noteContent}
                                                    onChange={(e) => setNoteContent(e.target.value)}
                                                    placeholder="Take notes for this chapter..."
                                                    className="w-full h-28 bg-white rounded-lg border border-gray-200 p-3 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                                                />
                                                <div className="mt-3 flex justify-end">
                                                    <button
                                                        onClick={handleSaveNote}
                                                        disabled={savingNote || !noteContent.trim()}
                                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                                    >
                                                        {savingNote ? "Saving..." : "Save Note"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "images" && (
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <ImageNotesUploader
                                                    courseId={courseId}
                                                    chapterId={chapter.$id}
                                                    onUploadComplete={handleImageUploadComplete}
                                                />
                                                
                                                {imageNotes.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                                                            Saved Images ({imageNotes.length})
                                                        </h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            {imageNotes.map((imageNote) => (
                                                                <ImageNoteCard
                                                                    key={imageNote.$id}
                                                                    imageNote={imageNote}
                                                                    onView={setViewingImageNote}
                                                                    onDelete={handleImageNoteDelete}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === "resources" && (
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                {resources.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {resources.map((resource) => (
                                                            <a
                                                                key={resource.$id}
                                                                href={resource.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all group"
                                                            >
                                                                <div className="flex-shrink-0">
                                                                    {getResourceIcon(resource.type)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors text-sm">
                                                                        {resource.name}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-500 capitalize">{resource.type}</p>
                                                                </div>
                                                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-gray-500 text-sm py-6">
                                                        No resources attached to this chapter.
                                                        <Link href={`/dashboard/courses/create/${courseId}`} className="block mt-2 text-indigo-600 hover:underline">
                                                            Add resources
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Image Note Viewer Modal */}
            {viewingImageNote && (
                <ImageNoteViewer
                    imageNote={viewingImageNote}
                    onClose={() => setViewingImageNote(null)}
                    onDelete={handleImageNoteDelete}
                />
            )}
        </div>
    );
}

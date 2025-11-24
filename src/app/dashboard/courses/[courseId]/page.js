"use client";
import { useState, useEffect, use } from "react";
import { databases, account } from "@/lib/appwrite";
import { COLLECTION_COURSES_ID, COLLECTION_CHAPTERS_ID, COLLECTION_TOPICS_ID, COLLECTION_PROGRESS_ID, COLLECTION_NOTES_ID, DATABASE_ID } from "@/lib/config";
import { ID, Query } from "appwrite";

export default function CoursePlayerPage({ params }) {
    const { courseId } = use(params);
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [activeTopic, setActiveTopic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("notes"); // notes, resources
    const [noteContent, setNoteContent] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [markingComplete, setMarkingComplete] = useState(false);
    const [completedTopics, setCompletedTopics] = useState(new Set());

    useEffect(() => {
        fetchData();
    }, [courseId]);

    const fetchData = async () => {
        try {
            const user = await account.get();
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

            // Set initial active topic
            if (chaptersWithTopics.length > 0 && chaptersWithTopics[0].topics.length > 0) {
                setActiveTopic(chaptersWithTopics[0].topics[0]);
            }

            // Fetch progress
            const progressData = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_PROGRESS_ID,
                [Query.equal("userId", user.$id), Query.equal("status", "completed")]
            );
            const completedSet = new Set(progressData.documents.map(p => p.topicId));
            setCompletedTopics(completedSet);

        } catch (error) {
            console.error("Error fetching course data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTopicClick = (topic) => {
        setActiveTopic(topic);
        setNoteContent(""); // Reset note for new topic (or fetch existing note if implemented)
    };

    const handleMarkComplete = async () => {
        if (!activeTopic || markingComplete) return;
        setMarkingComplete(true);
        try {
            const user = await account.get();
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_PROGRESS_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    topicId: activeTopic.$id,
                    status: "completed",
                    completedAt: new Date().toISOString(),
                }
            );
            setCompletedTopics(prev => new Set(prev).add(activeTopic.$id));
        } catch (error) {
            console.error("Error marking complete:", error);
        } finally {
            setMarkingComplete(false);
        }
    };

    const handleSaveNote = async () => {
        if (!noteContent.trim() || !activeTopic) return;
        setSavingNote(true);
        try {
            const user = await account.get();
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_NOTES_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    courseId: courseId,
                    chapterId: activeTopic.chapterId,
                    topicId: activeTopic.$id,
                    content: noteContent,
                }
            );
            alert("Note saved!");
            setNoteContent("");
        } catch (error) {
            console.error("Error saving note:", error);
        } finally {
            setSavingNote(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!course) return <div>Course not found</div>;

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)] overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden order-1 lg:order-2">
                {/* Header */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-8 bg-white flex-shrink-0">
                    <div className="overflow-hidden">
                        <span className="text-sm text-gray-500 block truncate">Current Topic</span>
                        <h2 className="text-lg font-bold text-gray-900 truncate">{activeTopic?.title}</h2>
                    </div>
                    <button
                        onClick={handleMarkComplete}
                        disabled={completedTopics.has(activeTopic?.$id) || markingComplete}
                        className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${completedTopics.has(activeTopic?.$id)
                            ? "bg-green-100 text-green-700 cursor-default"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                    >
                        {completedTopics.has(activeTopic?.$id) ? "Completed" : "Mark Complete"}
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Video/Content Player */}
                        <div className="aspect-video bg-black rounded-xl overflow-hidden mb-8 shadow-lg">
                            {activeTopic?.type === 'video' || activeTopic?.type === 'youtube' ? (
                                activeTopic.videoUrl ? (
                                    <iframe
                                        src={activeTopic.videoUrl.replace("watch?v=", "embed/")}
                                        className="w-full h-full"
                                        allowFullScreen
                                        title={activeTopic.title}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white">No Video URL</div>
                                )
                            ) : (
                                <div className="w-full h-full bg-white text-gray-900 p-8 overflow-y-auto">
                                    <div className="prose max-w-none">
                                        {activeTopic?.content || "No content available."}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="mb-6 border-b border-gray-200">
                            <div className="flex gap-8">
                                <button
                                    onClick={() => setActiveTab("notes")}
                                    className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === "notes" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Notes
                                    {activeTab === "notes" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>}
                                </button>
                                <button
                                    onClick={() => setActiveTab("resources")}
                                    className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === "resources" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Resources
                                    {activeTab === "resources" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>}
                                </button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === "notes" && (
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder="Take notes for this topic..."
                                    className="w-full h-32 bg-white rounded-lg border border-gray-200 p-4 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                                />
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={handleSaveNote}
                                        disabled={savingNote}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {savingNote ? "Saving..." : "Save Note"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "resources" && (
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center text-gray-500 text-sm">
                                No resources attached to this topic.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar - Syllabus */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0 order-2 lg:order-1 h-96 lg:h-auto">
                <div className="p-4 border-b border-gray-200 sticky top-0 bg-gray-50 z-10">
                    <h2 className="font-bold text-gray-900">Course Syllabus</h2>
                </div>
                <div className="p-4 space-y-6">
                    {chapters.map((chapter) => (
                        <div key={chapter.$id}>
                            <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">{chapter.title}</h3>
                            <div className="space-y-1">
                                {chapter.topics.map((topic) => {
                                    const isActive = activeTopic?.$id === topic.$id;
                                    const isCompleted = completedTopics.has(topic.$id);
                                    return (
                                        <button
                                            key={topic.$id}
                                            onClick={() => handleTopicClick(topic)}
                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? "bg-indigo-100 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                                                }`}
                                        >
                                            <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${isCompleted ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
                                                }`}>
                                                {isCompleted && <span className="text-[10px]">✓</span>}
                                            </div>
                                            <span className="truncate text-left">{topic.title}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

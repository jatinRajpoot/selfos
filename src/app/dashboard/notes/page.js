"use client";
import { useState, useEffect } from "react";
import { databases, account } from "@/lib/appwrite";
import { 
    COLLECTION_NOTES_ID, 
    COLLECTION_COURSES_ID, 
    COLLECTION_CHAPTERS_ID, 
    COLLECTION_TOPICS_ID, 
    DATABASE_ID 
} from "@/lib/config";
import { Query } from "appwrite";
import { NoteCardSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { 
    FolderIcon, 
    FolderOpenIcon, 
    ChevronRightIcon, 
    ChevronDownIcon,
    FileTextIcon,
    BookOpenIcon,
    LayersIcon,
    StickyNoteIcon,
    PencilIcon,
    Trash2Icon
} from "lucide-react";

// Folder Item Component for Course level
function CourseFolderItem({ course, chapters, topics, notes, expandedCourses, expandedChapters, expandedTopics, toggleCourse, toggleChapter, toggleTopic, onEdit, onDelete, editingNote, editContent, setEditContent, handleSaveEdit, handleCancelEdit, saving }) {
    const isExpanded = expandedCourses.has(course.$id);
    const courseChapters = chapters.filter(ch => ch.courseId === course.$id);
    const courseNotesCount = notes.filter(n => n.courseId === course.$id).length;

    return (
        <div className="select-none">
            <div 
                onClick={() => toggleCourse(course.$id)}
                className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
            >
                <span className="text-gray-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    <ChevronRightIcon className="w-4 h-4" />
                </span>
                {isExpanded ? (
                    <FolderOpenIcon className="w-5 h-5 text-indigo-500" />
                ) : (
                    <FolderIcon className="w-5 h-5 text-indigo-500" />
                )}
                <span className="font-medium text-gray-900 flex-1">{course.title}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {courseNotesCount} {courseNotesCount === 1 ? 'note' : 'notes'}
                </span>
            </div>
            
            {isExpanded && (
                <div className="ml-6 border-l border-gray-200 pl-2">
                    {courseChapters.length === 0 ? (
                        <div className="py-3 px-4 text-sm text-gray-400 italic">No chapters</div>
                    ) : (
                        courseChapters.map(chapter => (
                            <ChapterFolderItem 
                                key={chapter.$id}
                                chapter={chapter}
                                topics={topics}
                                notes={notes}
                                expandedChapters={expandedChapters}
                                expandedTopics={expandedTopics}
                                toggleChapter={toggleChapter}
                                toggleTopic={toggleTopic}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                editingNote={editingNote}
                                editContent={editContent}
                                setEditContent={setEditContent}
                                handleSaveEdit={handleSaveEdit}
                                handleCancelEdit={handleCancelEdit}
                                saving={saving}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// Folder Item Component for Chapter level
function ChapterFolderItem({ chapter, topics, notes, expandedChapters, expandedTopics, toggleChapter, toggleTopic, onEdit, onDelete, editingNote, editContent, setEditContent, handleSaveEdit, handleCancelEdit, saving }) {
    const isExpanded = expandedChapters.has(chapter.$id);
    const chapterTopics = topics.filter(t => t.chapterId === chapter.$id);
    const chapterNotesCount = notes.filter(n => n.chapterId === chapter.$id).length;

    return (
        <div>
            <div 
                onClick={() => toggleChapter(chapter.$id)}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            >
                <span className="text-gray-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    <ChevronRightIcon className="w-4 h-4" />
                </span>
                {isExpanded ? (
                    <BookOpenIcon className="w-4 h-4 text-amber-500" />
                ) : (
                    <LayersIcon className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-sm font-medium text-gray-700 flex-1">{chapter.title}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {chapterNotesCount}
                </span>
            </div>
            
            {isExpanded && (
                <div className="ml-6 border-l border-gray-100 pl-2">
                    {chapterTopics.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-gray-400 italic">No topics</div>
                    ) : (
                        chapterTopics.map(topic => (
                            <TopicFolderItem 
                                key={topic.$id}
                                topic={topic}
                                notes={notes}
                                expandedTopics={expandedTopics}
                                toggleTopic={toggleTopic}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                editingNote={editingNote}
                                editContent={editContent}
                                setEditContent={setEditContent}
                                handleSaveEdit={handleSaveEdit}
                                handleCancelEdit={handleCancelEdit}
                                saving={saving}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// Folder Item Component for Topic level (contains notes)
function TopicFolderItem({ topic, notes, expandedTopics, toggleTopic, onEdit, onDelete, editingNote, editContent, setEditContent, handleSaveEdit, handleCancelEdit, saving }) {
    const isExpanded = expandedTopics.has(topic.$id);
    const topicNotes = notes.filter(n => n.topicId === topic.$id);

    return (
        <div>
            <div 
                onClick={() => toggleTopic(topic.$id)}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            >
                <span className="text-gray-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    <ChevronRightIcon className="w-3 h-3" />
                </span>
                <FileTextIcon className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-gray-600 flex-1">{topic.title}</span>
                <span className="text-xs text-gray-400 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                    {topicNotes.length}
                </span>
            </div>
            
            {isExpanded && (
                <div className="ml-6 pl-2 space-y-2 py-2">
                    {topicNotes.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-gray-400 italic">No notes for this topic</div>
                    ) : (
                        topicNotes.map(note => (
                            <NoteItem 
                                key={note.$id}
                                note={note}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                editingNote={editingNote}
                                editContent={editContent}
                                setEditContent={setEditContent}
                                handleSaveEdit={handleSaveEdit}
                                handleCancelEdit={handleCancelEdit}
                                saving={saving}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// Individual Note Item
function NoteItem({ note, onEdit, onDelete, editingNote, editContent, setEditContent, handleSaveEdit, handleCancelEdit, saving }) {
    const isEditing = editingNote === note.$id;

    return (
        <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start gap-2">
                <StickyNoteIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full h-24 bg-gray-50 rounded-lg border border-gray-200 p-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                                placeholder="Write your note..."
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSaveEdit(note.$id); }}
                                    disabled={saving}
                                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{note.content}</p>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                                <span className="text-xs text-gray-400">
                                    {new Date(note.$createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(note); }}
                                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                        aria-label="Edit note"
                                    >
                                        <PencilIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(note.$id); }}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                        aria-label="Delete note"
                                    >
                                        <Trash2Icon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Quick Capture Notes Section
function QuickCaptureSection({ notes, onEdit, onDelete, editingNote, editContent, setEditContent, handleSaveEdit, handleCancelEdit, saving, isExpanded, onToggle }) {
    const quickNotes = notes.filter(n => n.courseId === "quick-capture");
    
    if (quickNotes.length === 0) return null;

    return (
        <div className="mb-4">
            <div 
                onClick={onToggle}
                className="flex items-center gap-2 p-3 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors bg-amber-50/50"
            >
                <span className="text-amber-500 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    <ChevronRightIcon className="w-4 h-4" />
                </span>
                <StickyNoteIcon className="w-5 h-5 text-amber-500" />
                <span className="font-medium text-amber-700 flex-1">Quick Capture</span>
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                    {quickNotes.length} {quickNotes.length === 1 ? 'note' : 'notes'}
                </span>
            </div>
            
            {isExpanded && (
                <div className="ml-6 pl-4 py-2 space-y-2 border-l border-amber-200">
                    {quickNotes.map(note => (
                        <NoteItem 
                            key={note.$id}
                            note={note}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            editingNote={editingNote}
                            editContent={editContent}
                            setEditContent={setEditContent}
                            handleSaveEdit={handleSaveEdit}
                            handleCancelEdit={handleCancelEdit}
                            saving={saving}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function NotesPage() {
    const [notes, setNotes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingNote, setEditingNote] = useState(null);
    const [editContent, setEditContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
    
    // Expanded state for folder structure
    const [expandedCourses, setExpandedCourses] = useState(new Set());
    const [expandedChapters, setExpandedChapters] = useState(new Set());
    const [expandedTopics, setExpandedTopics] = useState(new Set());
    const [quickCaptureExpanded, setQuickCaptureExpanded] = useState(true);
    
    const toast = useToast();

    const fetchData = async () => {
        try {
            const user = await account.get();
            
            // Fetch all data in parallel
            const [notesRes, coursesRes, chaptersRes, topicsRes] = await Promise.all([
                databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_NOTES_ID,
                    [Query.equal("userId", user.$id), Query.orderDesc("$createdAt"), Query.limit(500)]
                ),
                databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_COURSES_ID,
                    [Query.equal("authorId", user.$id), Query.limit(100)]
                ),
                databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_CHAPTERS_ID,
                    [Query.limit(500)]
                ),
                databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_TOPICS_ID,
                    [Query.limit(1000)]
                )
            ]);

            setNotes(notesRes.documents);
            setCourses(coursesRes.documents);
            
            // Filter chapters and topics to only include those belonging to user's courses
            const courseIds = new Set(coursesRes.documents.map(c => c.$id));
            const userChapters = chaptersRes.documents.filter(ch => courseIds.has(ch.courseId));
            setChapters(userChapters);
            
            const chapterIds = new Set(userChapters.map(ch => ch.$id));
            const userTopics = topicsRes.documents.filter(t => chapterIds.has(t.chapterId));
            setTopics(userTopics);
            
            // Auto-expand courses that have notes
            const coursesWithNotes = new Set(notesRes.documents.map(n => n.courseId).filter(id => id !== "quick-capture"));
            setExpandedCourses(coursesWithNotes);
            
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load notes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleCourse = (courseId) => {
        setExpandedCourses(prev => {
            const next = new Set(prev);
            if (next.has(courseId)) {
                next.delete(courseId);
            } else {
                next.add(courseId);
            }
            return next;
        });
    };

    const toggleChapter = (chapterId) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            if (next.has(chapterId)) {
                next.delete(chapterId);
            } else {
                next.add(chapterId);
            }
            return next;
        });
    };

    const toggleTopic = (topicId) => {
        setExpandedTopics(prev => {
            const next = new Set(prev);
            if (next.has(topicId)) {
                next.delete(topicId);
            } else {
                next.add(topicId);
            }
            return next;
        });
    };

    const handleEdit = (note) => {
        setEditingNote(note.$id);
        setEditContent(note.content);
    };

    const handleCancelEdit = () => {
        setEditingNote(null);
        setEditContent("");
    };

    const handleSaveEdit = async (noteId) => {
        if (!editContent.trim()) return;
        setSaving(true);
        try {
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_NOTES_ID,
                noteId,
                { content: editContent }
            );
            toast.success("Note updated successfully");
            setEditingNote(null);
            setEditContent("");
            fetchData();
        } catch (error) {
            console.error("Error updating note:", error);
            toast.error("Failed to update note");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (noteId) => {
        setConfirmDialog({
            isOpen: true,
            title: "Delete Note",
            message: "Are you sure you want to delete this note? This action cannot be undone.",
            onConfirm: async () => {
                try {
                    await databases.deleteDocument(DATABASE_ID, COLLECTION_NOTES_ID, noteId);
                    toast.success("Note deleted successfully");
                    fetchData();
                } catch (error) {
                    console.error("Error deleting note:", error);
                    toast.error("Failed to delete note");
                } finally {
                    setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null });
                }
            }
        });
    };

    // Get courses that have notes (excluding quick-capture)
    const coursesWithNotes = courses.filter(course => 
        notes.some(note => note.courseId === course.$id)
    );

    // Get orphaned notes (notes with courseId that doesn't match any owned course, excluding quick-capture)
    const courseIds = new Set(courses.map(c => c.$id));
    const orphanedNotes = notes.filter(note => 
        note.courseId !== "quick-capture" && !courseIds.has(note.courseId)
    );

    // Calculate actual displayable notes count (excluding orphaned ones)
    const displayableNotesCount = notes.length - orphanedNotes.length;

    if (loading) {
        return (
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">My Notes</h1>
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
                            <NoteCardSkeleton />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FolderIcon className="w-4 h-4" />
                    <span>{displayableNotesCount} total notes</span>
                </div>
            </div>
            
            {notes.length === 0 ? (
                <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-12">
                    <div className="text-center">
                        <div className="mx-auto w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                            <StickyNoteIcon className="w-12 h-12 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No notes yet</h3>
                        <p className="text-gray-500">Start taking notes while learning to see them organized here.</p>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
                    {/* Quick Capture Section */}
                    <QuickCaptureSection 
                        notes={notes}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        editingNote={editingNote}
                        editContent={editContent}
                        setEditContent={setEditContent}
                        handleSaveEdit={handleSaveEdit}
                        handleCancelEdit={handleCancelEdit}
                        saving={saving}
                        isExpanded={quickCaptureExpanded}
                        onToggle={() => setQuickCaptureExpanded(!quickCaptureExpanded)}
                    />
                    
                    {/* Course Folders */}
                    <div className="space-y-1">
                        {coursesWithNotes.length === 0 && notes.filter(n => n.courseId !== "quick-capture").length === 0 ? (
                            <div className="py-8 text-center text-gray-400">
                                <p>No course notes yet. Notes will appear here organized by course.</p>
                            </div>
                        ) : (
                            coursesWithNotes.map(course => (
                                <CourseFolderItem 
                                    key={course.$id}
                                    course={course}
                                    chapters={chapters}
                                    topics={topics}
                                    notes={notes}
                                    expandedCourses={expandedCourses}
                                    expandedChapters={expandedChapters}
                                    expandedTopics={expandedTopics}
                                    toggleCourse={toggleCourse}
                                    toggleChapter={toggleChapter}
                                    toggleTopic={toggleTopic}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    editingNote={editingNote}
                                    editContent={editContent}
                                    setEditContent={setEditContent}
                                    handleSaveEdit={handleSaveEdit}
                                    handleCancelEdit={handleCancelEdit}
                                    saving={saving}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
            
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

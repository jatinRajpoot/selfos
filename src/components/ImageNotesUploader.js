"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { storage, databases, account } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTION_IMAGE_NOTES_ID, BUCKET_ID } from "@/lib/config";
import { ID } from "appwrite";
import { useToast } from "@/components/Toast";
import {
    ImageIcon,
    UploadCloudIcon,
    XIcon,
    Loader2Icon,
    PlusIcon,
} from "lucide-react";

export default function ImageNotesUploader({
    courseId,
    chapterId,
    onUploadComplete,
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [caption, setCaption] = useState("");
    const fileInputRef = useRef(null);
    const toast = useToast();

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter((file) =>
            file.type.startsWith("image/")
        );
        addFiles(files);
    }, []);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files).filter((file) =>
            file.type.startsWith("image/")
        );
        addFiles(files);
        e.target.value = ""; // Reset input
    };

    const addFiles = (files) => {
        if (files.length === 0) {
            toast.error("Please select image files only");
            return;
        }

        // Create previews
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        
        setSelectedFiles((prev) => [...prev, ...files]);
        setPreviews((prev) => [...prev, ...newPreviews]);
    };

    const removeFile = (index) => {
        URL.revokeObjectURL(previews[index]);
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const clearAll = () => {
        previews.forEach((url) => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setPreviews([]);
        setCaption("");
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error("Please select at least one image");
            return;
        }

        setUploading(true);
        try {
            const user = await account.get();
            const uploadedFileIds = [];

            // Upload each file to Appwrite storage
            for (const file of selectedFiles) {
                const uploadedFile = await storage.createFile(
                    BUCKET_ID,
                    ID.unique(),
                    file
                );
                uploadedFileIds.push(uploadedFile.$id);
            }

            // Create image note document
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_IMAGE_NOTES_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    courseId,
                    chapterId,
                    imageIds: JSON.stringify(uploadedFileIds),
                    caption: caption.trim() || null,
                }
            );

            toast.success(`${selectedFiles.length} image(s) saved as note!`);
            clearAll();
            
            if (onUploadComplete) {
                onUploadComplete();
            }
        } catch (error) {
            console.error("Error uploading images:", error);
            toast.error("Failed to save image note");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <UploadCloudIcon
                    className={`w-12 h-12 mx-auto mb-3 ${
                        isDragging ? "text-indigo-500" : "text-gray-400"
                    }`}
                />
                <p className="text-sm font-medium text-gray-700">
                    {isDragging
                        ? "Drop images here"
                        : "Drag & drop images or click to browse"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB each
                </p>
            </div>

            {/* Preview Grid */}
            {previews.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            {selectedFiles.length} image(s) selected
                        </span>
                        <button
                            onClick={clearAll}
                            className="text-sm text-red-600 hover:text-red-700"
                        >
                            Clear all
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                        {previews.map((preview, index) => (
                            <div
                                key={index}
                                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                            >
                                <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        
                        {/* Add more button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                        >
                            <PlusIcon className="w-8 h-8" />
                            <span className="text-xs mt-1">Add more</span>
                        </button>
                    </div>

                    {/* Caption Input */}
                    <div>
                        <input
                            type="text"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Add a caption (optional)"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {uploading ? (
                            <>
                                <Loader2Icon className="w-5 h-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <ImageIcon className="w-5 h-5" />
                                Save as Image Note
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

// Component to display a single image note
export function ImageNoteCard({ imageNote, onDelete, onView }) {
    const [imageUrls, setImageUrls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadImages = async () => {
            try {
                const ids = JSON.parse(imageNote.imageIds);
                const urls = ids.map((id) =>
                    storage.getFilePreview(BUCKET_ID, id, 400, 400)
                );
                setImageUrls(urls);
            } catch (error) {
                console.error("Error loading image preview:", error);
            } finally {
                setLoading(false);
            }
        };
        loadImages();
    }, [imageNote.imageIds]);

    if (loading) {
        return (
            <div className="bg-white border border-gray-100 rounded-lg p-3 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group">
            <div className="relative">
                {imageUrls.length === 1 ? (
                    <img
                        src={imageUrls[0]}
                        alt={imageNote.caption || "Image note"}
                        className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                        onClick={() => onView && onView(imageNote)}
                    />
                ) : (
                    <div
                        className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => onView && onView(imageNote)}
                    >
                        {imageUrls.slice(0, 4).map((url, idx) => (
                            <div key={idx} className="relative aspect-square">
                                <img
                                    src={url}
                                    alt={`Image ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {idx === 3 && imageUrls.length > 4 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">
                                        +{imageUrls.length - 4}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {imageNote.caption && (
                <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                    {imageNote.caption}
                </p>
            )}
            
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <span className="text-xs text-gray-400">
                    {new Date(imageNote.$createdAt).toLocaleDateString()}
                </span>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {JSON.parse(imageNote.imageIds).length} image(s)
                </span>
            </div>
        </div>
    );
}

// Image viewer modal
export function ImageNoteViewer({ imageNote, onClose, onDelete }) {
    const [imageUrls, setImageUrls] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const loadImages = async () => {
            try {
                const ids = JSON.parse(imageNote.imageIds);
                const urls = ids.map((id) =>
                    storage.getFileView(BUCKET_ID, id)
                );
                setImageUrls(urls);
            } catch (error) {
                console.error("Error loading images:", error);
            } finally {
                setLoading(false);
            }
        };
        loadImages();
    }, [imageNote.imageIds]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this image note?")) return;
        
        setDeleting(true);
        try {
            // Delete files from storage
            const ids = JSON.parse(imageNote.imageIds);
            for (const id of ids) {
                await storage.deleteFile(BUCKET_ID, id);
            }
            
            // Delete document
            await databases.deleteDocument(
                DATABASE_ID,
                COLLECTION_IMAGE_NOTES_ID,
                imageNote.$id
            );
            
            toast.success("Image note deleted");
            onDelete && onDelete(imageNote.$id);
            onClose();
        } catch (error) {
            console.error("Error deleting image note:", error);
            toast.error("Failed to delete image note");
        } finally {
            setDeleting(false);
        }
    };

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
                >
                    <XIcon className="w-8 h-8" />
                </button>

                {/* Image */}
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <Loader2Icon className="w-12 h-12 text-white animate-spin" />
                    </div>
                ) : (
                    <div className="relative">
                        <img
                            src={imageUrls[currentIndex]}
                            alt={imageNote.caption || "Image note"}
                            className="max-w-full max-h-[70vh] mx-auto rounded-lg object-contain"
                        />
                        
                        {/* Navigation arrows */}
                        {imageUrls.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                                >
                                    ←
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                                >
                                    →
                                </button>
                                
                                {/* Image counter */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white text-sm">
                                    {currentIndex + 1} / {imageUrls.length}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Caption and actions */}
                <div className="mt-4 flex items-center justify-between text-white">
                    <p className="text-sm">
                        {imageNote.caption || "No caption"}
                    </p>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {deleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

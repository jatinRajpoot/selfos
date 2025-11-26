import { NextResponse } from "next/server";
import { databases } from "@/lib/server/appwrite";
import { authenticateApiRequest } from "@/lib/server/apiAuth";
import { DATABASE_ID, COLLECTION_NOTES_ID } from "@/lib/config";

/**
 * GET /api/gpt/notes/[noteId] - Get a single note
 */
export async function GET(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { noteId } = await params;

    try {
        const note = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_NOTES_ID,
            noteId
        );

        // Verify ownership
        if (note.userId !== auth.userId) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: note.$id,
            content: note.content,
            courseId: note.courseId,
            chapterId: note.chapterId,
            createdAt: note.$createdAt,
            updatedAt: note.$updatedAt
        });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }
        console.error("Error fetching note:", error);
        return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
    }
}

/**
 * PUT /api/gpt/notes/[noteId] - Update a note
 * Body: { content }
 */
export async function PUT(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { noteId } = await params;

    try {
        // Verify ownership
        const note = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_NOTES_ID,
            noteId
        );

        if (note.userId !== auth.userId) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        const body = await request.json();
        
        if (!body.content || body.content.trim().length === 0) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const updated = await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_NOTES_ID,
            noteId,
            {
                content: body.content.trim().slice(0, 10000)
            }
        );

        return NextResponse.json({
            id: updated.$id,
            content: updated.content,
            courseId: updated.courseId,
            chapterId: updated.chapterId,
            updatedAt: updated.$updatedAt
        });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }
        console.error("Error updating note:", error);
        return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
    }
}

/**
 * DELETE /api/gpt/notes/[noteId] - Delete a note
 */
export async function DELETE(request, { params }) {
    const auth = await authenticateApiRequest(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const { noteId } = await params;

    try {
        // Verify ownership
        const note = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_NOTES_ID,
            noteId
        );

        if (note.userId !== auth.userId) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTION_NOTES_ID,
            noteId
        );

        return NextResponse.json({ success: true, message: "Note deleted" });
    } catch (error) {
        if (error.code === 404) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }
        console.error("Error deleting note:", error);
        return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";

const openApiSpec = {
    openapi: "3.1.0",
    info: {
        title: "SelfOS GPT API",
        description: "API for controlling your SelfOS learning management system. Create courses, manage chapters, track progress, take notes, and add resources - all through your Custom GPT.",
        version: "1.0.0"
    },
    servers: [
        {
            url: "https://your-selfos-site.com",
            description: "Your SelfOS deployment URL (replace with your actual URL)"
        }
    ],
    paths: {
        "/api/gpt/courses": {
            get: {
                operationId: "listCourses",
                summary: "List all courses",
                description: "Get all courses for the authenticated user with optional chapter details and progress.",
                parameters: [
                    {
                        name: "includeChapters",
                        in: "query",
                        description: "Include chapters and their progress in the response",
                        schema: { type: "boolean", default: false }
                    }
                ],
                responses: {
                    "200": {
                        description: "List of courses",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        courses: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/Course" }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" }
                }
            },
            post: {
                operationId: "createCourse",
                summary: "Create a new course",
                description: "Create a new course with optional chapters. Call this when the user wants to start learning something new.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["title"],
                                properties: {
                                    title: { type: "string", description: "Course title", maxLength: 255 },
                                    description: { type: "string", description: "Course description", maxLength: 5000 },
                                    published: { type: "boolean", default: false },
                                    chapters: {
                                        type: "array",
                                        description: "Initial chapters to create (array of chapter title strings)",
                                        items: {
                                            type: "string"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "201": {
                        description: "Course created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CourseWithChapters" }
                            }
                        }
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" }
                }
            }
        },
        "/api/gpt/courses/{courseId}": {
            get: {
                operationId: "getCourse",
                summary: "Get course details",
                description: "Get a single course with all chapters, progress, and statistics.",
                parameters: [
                    { name: "courseId", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    "200": {
                        description: "Course details",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CourseDetail" }
                            }
                        }
                    },
                    "404": { $ref: "#/components/responses/NotFound" }
                }
            },
            put: {
                operationId: "updateCourse",
                summary: "Update a course",
                description: "Update course title, description, or published status.",
                parameters: [
                    { name: "courseId", in: "path", required: true, schema: { type: "string" } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    title: { type: "string", maxLength: 255 },
                                    description: { type: "string", maxLength: 5000 },
                                    published: { type: "boolean" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": { description: "Course updated" },
                    "404": { $ref: "#/components/responses/NotFound" }
                }
            },
            delete: {
                operationId: "deleteCourse",
                summary: "Delete a course",
                description: "Delete a course and all its chapters, progress, notes, and resources. This is irreversible.",
                parameters: [
                    { name: "courseId", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    "200": { description: "Course deleted" },
                    "404": { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/gpt/courses/{courseId}/chapters": {
            get: {
                operationId: "listChapters",
                summary: "List chapters in a course",
                description: "Get all chapters for a course with their completion status.",
                parameters: [
                    { name: "courseId", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    "200": {
                        description: "List of chapters",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        courseId: { type: "string" },
                                        courseTitle: { type: "string" },
                                        chapters: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/Chapter" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                operationId: "addChapters",
                summary: "Add chapters to a course",
                description: "Add one or more chapters to an existing course. Provide either a single 'title' or an array of 'chapters'.",
                parameters: [
                    { name: "courseId", in: "path", required: true, schema: { type: "string" } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    title: { 
                                        type: "string",
                                        description: "Single chapter title (use this OR chapters array)"
                                    },
                                    chapters: {
                                        type: "array",
                                        description: "Array of chapter titles (use this OR single title)",
                                        items: {
                                            type: "string"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "201": { description: "Chapters created" }
                }
            }
        },
        "/api/gpt/chapters/{chapterId}": {
            get: {
                operationId: "getChapter",
                summary: "Get chapter details",
                description: "Get a single chapter with its resources and progress.",
                parameters: [
                    { name: "chapterId", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    "200": {
                        description: "Chapter details",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ChapterDetail" }
                            }
                        }
                    }
                }
            },
            put: {
                operationId: "updateChapter",
                summary: "Update a chapter",
                description: "Update chapter title or order.",
                parameters: [
                    { name: "chapterId", in: "path", required: true, schema: { type: "string" } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    title: { type: "string", maxLength: 255 },
                                    order: { type: "integer", minimum: 1 }
                                }
                            }
                        }
                    }
                },
                responses: { "200": { description: "Chapter updated" } }
            },
            delete: {
                operationId: "deleteChapter",
                summary: "Delete a chapter",
                description: "Delete a chapter and its resources and progress.",
                parameters: [
                    { name: "chapterId", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: { "200": { description: "Chapter deleted" } }
            }
        },
        "/api/gpt/chapters/{chapterId}/complete": {
            post: {
                operationId: "markChapterComplete",
                summary: "Mark chapter as completed",
                description: "Mark a chapter as completed. Call this when the user finishes studying a topic. Returns updated course progress.",
                parameters: [
                    { name: "chapterId", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    "200": {
                        description: "Chapter marked complete",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        chapterId: { type: "string" },
                                        chapterTitle: { type: "string" },
                                        status: { type: "string", enum: ["completed"] },
                                        completedAt: { type: "string", format: "date-time" },
                                        courseProgress: {
                                            type: "object",
                                            properties: {
                                                courseId: { type: "string" },
                                                courseTitle: { type: "string" },
                                                completedChapters: { type: "integer" },
                                                totalChapters: { type: "integer" },
                                                progressPercent: { type: "integer" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            delete: {
                operationId: "resetChapterProgress",
                summary: "Reset chapter progress",
                description: "Remove completion status from a chapter.",
                parameters: [
                    { name: "chapterId", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: { "200": { description: "Progress reset" } }
            }
        },
        "/api/gpt/notes": {
            get: {
                operationId: "listNotes",
                summary: "List notes",
                description: "Get user's notes, optionally filtered by course or chapter.",
                parameters: [
                    { name: "courseId", in: "query", schema: { type: "string" }, description: "Filter by course" },
                    { name: "chapterId", in: "query", schema: { type: "string" }, description: "Filter by chapter" },
                    { name: "limit", in: "query", schema: { type: "integer", maximum: 100, default: 50 } }
                ],
                responses: {
                    "200": {
                        description: "List of notes",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        notes: { type: "array", items: { $ref: "#/components/schemas/Note" } },
                                        total: { type: "integer" }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                operationId: "createNote",
                summary: "Create a note",
                description: "Create a new note. Can be a quick note (no course/chapter) or linked to specific course/chapter.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["content"],
                                properties: {
                                    content: { type: "string", maxLength: 10000, description: "Note content" },
                                    courseId: { type: "string", description: "Optional course ID" },
                                    chapterId: { type: "string", description: "Optional chapter ID" }
                                }
                            }
                        }
                    }
                },
                responses: { "201": { description: "Note created" } }
            }
        },
        "/api/gpt/notes/{noteId}": {
            get: {
                operationId: "getNote",
                summary: "Get a note",
                parameters: [{ name: "noteId", in: "path", required: true, schema: { type: "string" } }],
                responses: { "200": { description: "Note details" } }
            },
            put: {
                operationId: "updateNote",
                summary: "Update a note",
                parameters: [{ name: "noteId", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["content"],
                                properties: { content: { type: "string", maxLength: 10000 } }
                            }
                        }
                    }
                },
                responses: { "200": { description: "Note updated" } }
            },
            delete: {
                operationId: "deleteNote",
                summary: "Delete a note",
                parameters: [{ name: "noteId", in: "path", required: true, schema: { type: "string" } }],
                responses: { "200": { description: "Note deleted" } }
            }
        },
        "/api/gpt/resources": {
            get: {
                operationId: "listResources",
                summary: "List resources for a chapter",
                parameters: [
                    { name: "chapterId", in: "query", required: true, schema: { type: "string" } }
                ],
                responses: {
                    "200": {
                        description: "List of resources",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        chapterId: { type: "string" },
                                        resources: { type: "array", items: { $ref: "#/components/schemas/Resource" } }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                operationId: "createResource",
                summary: "Add a resource to a chapter",
                description: "Add a learning resource (webpage, YouTube video, ChatGPT link, etc.) to a chapter.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["chapterId", "name", "type"],
                                properties: {
                                    chapterId: { type: "string" },
                                    name: { type: "string", maxLength: 255, description: "Resource name" },
                                    type: {
                                        type: "string",
                                        enum: ["pdf", "webpage", "youtube", "chatgpt", "gemini", "file"],
                                        description: "Type of resource"
                                    },
                                    url: { type: "string", format: "uri", description: "URL for the resource (required for webpage, youtube, chatgpt, gemini)" }
                                }
                            }
                        }
                    }
                },
                responses: { "201": { description: "Resource created" } }
            }
        },
        "/api/gpt/resources/{resourceId}": {
            get: {
                operationId: "getResource",
                summary: "Get a resource",
                parameters: [{ name: "resourceId", in: "path", required: true, schema: { type: "string" } }],
                responses: { "200": { description: "Resource details" } }
            },
            delete: {
                operationId: "deleteResource",
                summary: "Delete a resource",
                parameters: [{ name: "resourceId", in: "path", required: true, schema: { type: "string" } }],
                responses: { "200": { description: "Resource deleted" } }
            }
        }
    },
    components: {
        schemas: {
            Course: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    published: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" }
                }
            },
            CourseWithChapters: {
                allOf: [
                    { $ref: "#/components/schemas/Course" },
                    {
                        type: "object",
                        properties: {
                            chapters: { type: "array", items: { $ref: "#/components/schemas/Chapter" } }
                        }
                    }
                ]
            },
            CourseDetail: {
                allOf: [
                    { $ref: "#/components/schemas/CourseWithChapters" },
                    {
                        type: "object",
                        properties: {
                            stats: {
                                type: "object",
                                properties: {
                                    totalChapters: { type: "integer" },
                                    completedChapters: { type: "integer" },
                                    progressPercent: { type: "integer" }
                                }
                            }
                        }
                    }
                ]
            },
            Chapter: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    order: { type: "integer" },
                    progress: {
                        type: "object",
                        nullable: true,
                        properties: {
                            status: { type: "string", enum: ["completed", "in-progress"] },
                            completedAt: { type: "string", format: "date-time", nullable: true }
                        }
                    }
                }
            },
            ChapterDetail: {
                allOf: [
                    { $ref: "#/components/schemas/Chapter" },
                    {
                        type: "object",
                        properties: {
                            courseId: { type: "string" },
                            courseTitle: { type: "string" },
                            resources: { type: "array", items: { $ref: "#/components/schemas/Resource" } }
                        }
                    }
                ]
            },
            Note: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    content: { type: "string" },
                    courseId: { type: "string" },
                    courseTitle: { type: "string" },
                    chapterId: { type: "string" },
                    chapterTitle: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" }
                }
            },
            Resource: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    type: { type: "string", enum: ["pdf", "webpage", "youtube", "chatgpt", "gemini", "file"] },
                    url: { type: "string", nullable: true },
                    fileId: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" }
                }
            }
        },
        responses: {
            Unauthorized: {
                description: "API key missing or invalid",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: { error: { type: "string" } }
                        }
                    }
                }
            },
            BadRequest: {
                description: "Invalid request body",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: { error: { type: "string" } }
                        }
                    }
                }
            },
            NotFound: {
                description: "Resource not found",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: { error: { type: "string" } }
                        }
                    }
                }
            }
        },
        securitySchemes: {
            ApiKeyAuth: {
                type: "apiKey",
                in: "header",
                name: "x-api-key",
                description: "API key generated from your SelfOS Settings page"
            }
        }
    },
    security: [{ ApiKeyAuth: [] }]
};

export async function GET(request) {
    // Get the host from request to populate the server URL
    const host = request.headers.get("host");
    // Always use HTTPS for production
    const protocol = "https";
    
    const spec = {
        ...openApiSpec,
        servers: [
            {
                url: `${protocol}://${host}`,
                description: "Your SelfOS deployment"
            }
        ]
    };

    return NextResponse.json(spec, {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
    });
}

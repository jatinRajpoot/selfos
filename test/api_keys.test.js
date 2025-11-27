
import { GET, POST } from "../src/app/api/keys/route";
import { databases, users } from "../src/lib/server/appwrite";
import { generateApiKey, hashApiKey } from "../src/lib/server/apiAuth";
import { NextResponse } from "next/server";

// Mock dependencies
jest.mock("../src/lib/server/appwrite", () => ({
  databases: {
    listDocuments: jest.fn(),
    createDocument: jest.fn(),
  },
  users: {
    get: jest.fn(),
  },
}));

jest.mock("../src/lib/server/apiAuth", () => {
    const originalModule = jest.requireActual("../src/lib/server/apiAuth");
    return {
        __esModule: true,
        ...originalModule,
        generateApiKey: jest.fn(),
    };
});

jest.mock("../src/lib/config", () => ({
  DATABASE_ID: "db-id",
  COLLECTION_API_KEYS_ID: "col-id",
}));

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options, status: options?.status || 200 })),
  },
}));

describe("API Keys Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should store keyLast4 and use it for keyHint", async () => {
    const userId = "user123";
    const plainApiKey = "sos_1234567890abcdef1234567890abcdef"; // Ends with 'cdef'
    const hashedKey = hashApiKey(plainApiKey); // SHA-256 hash of the key
    const last4Key = plainApiKey.slice(-4);

    // Mock generateApiKey to return our fixed key
    require("../src/lib/server/apiAuth").generateApiKey.mockReturnValue(plainApiKey);

    // Mock users.get to succeed
    users.get.mockResolvedValue({ $id: userId });

    // Mock database list to return empty (no existing keys) for POST check
    databases.listDocuments.mockResolvedValueOnce({ documents: [] });

    // Mock database create for POST
    databases.createDocument.mockResolvedValue({
      $id: "key1",
      name: "Test Key",
      userId,
      keyHash: hashedKey,
      keyLast4: last4Key,
      createdAt: new Date().toISOString(),
    });

    // 1. Create a key
    const reqPost = {
      json: async () => ({ userId, name: "Test Key" }),
    };
    await POST(reqPost);

    // Verify what was stored
    expect(databases.createDocument).toHaveBeenCalledWith(
      "db-id",
      "col-id",
      expect.anything(),
      expect.objectContaining({
        keyHash: hashedKey,
        keyLast4: last4Key, // Should now store last 4 chars
      })
    );

    // 2. List keys (GET)
    // Mock database list for GET
    databases.listDocuments.mockResolvedValueOnce({
      documents: [
        {
          $id: "key1",
          name: "Test Key",
          userId,
          keyHash: hashedKey,
          keyLast4: last4Key, // New field present
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const reqGet = {
      url: `http://localhost/api/keys?userId=${userId}`,
    };

    const response = await GET(reqGet);
    const keys = response.data.keys;

    expect(keys).toHaveLength(1);
    const keyHint = keys[0].keyHint;

    expect(keyHint).toContain(last4Key);
    expect(keyHint).toBe(`sos_****${last4Key}`);
  });

  it("should fallback to create without keyLast4 if schema is missing", async () => {
    const userId = "user123";
    const plainApiKey = "sos_key";

    // Mock users.get
    users.get.mockResolvedValue({ $id: userId });
    // Mock existing keys check
    databases.listDocuments.mockResolvedValue({ documents: [] });

    // Mock createDocument to fail first, then succeed
    const error = new Error("Attribute not found");
    error.code = 400;

    databases.createDocument
        .mockRejectedValueOnce(error) // First attempt fails
        .mockResolvedValueOnce({
            $id: "key2",
            name: "Fallback Key",
            createdAt: new Date().toISOString()
        }); // Second attempt succeeds

    const reqPost = {
        json: async () => ({ userId, name: "Fallback Key" }),
    };

    await POST(reqPost);

    // Should have called createDocument twice
    expect(databases.createDocument).toHaveBeenCalledTimes(2);
    // Second call should NOT have keyLast4
    expect(databases.createDocument).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.not.objectContaining({ keyLast4: expect.anything() })
    );
  });
});

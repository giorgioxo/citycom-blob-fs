import type { OpenAPIV3 } from "openapi-types";

export const openapi: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "FS Blob API",
    version: "1.0.0",
    description: "Backend-only MVP: Auth (JWT + Refresh cookie) + File System API",
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [{ name: "Health" }, { name: "Auth" }, { name: "FS - Directories" }, { name: "FS - Files" }, { name: "FS - Nodes" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          detail: { type: "string" },
        },
        required: ["message"],
      },

      RegisterRequest: {
        type: "object",
        properties: {
          username: { type: "string", minLength: 3, example: "giorgi" },
          password: { type: "string", minLength: 6, example: "secret123" },
        },
        required: ["username", "password"],
      },
      RegisterResponse: {
        type: "object",
        properties: { id: { type: "string" }, username: { type: "string" } },
        required: ["id", "username"],
      },

      LoginRequest: { $ref: "#/components/schemas/RegisterRequest" },
      LoginResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          accessToken: { type: "string" },
          tokenType: { type: "string", example: "Bearer" },
          expiresIn: { type: "number", example: 900 },
        },
        required: ["id", "username", "accessToken", "tokenType", "expiresIn"],
      },

      RefreshRequest: {
        type: "object",
        properties: {
          refreshToken: {
            type: "string",
            description: "Optional if refresh cookie exists",
          },
        },
      },
      RefreshResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          tokenType: { type: "string", example: "Bearer" },
          expiresIn: { type: "number", example: 900 },
        },
        required: ["accessToken", "tokenType", "expiresIn"],
      },

      LogoutRequest: {
        type: "object",
        properties: { refreshToken: { type: "string" } },
        description: "Optional if cookie exists",
      },

      CreatePathRequest: {
        type: "object",
        properties: { path: { type: "string", example: "/docs" } },
        required: ["path"],
      },

      MoveCopyRequest: {
        type: "object",
        properties: {
          from: { type: "string", example: "/a" },
          to: { type: "string", example: "/b" },
        },
        required: ["from", "to"],
      },

      CreateFileRequest: {
        type: "object",
        properties: {
          path: { type: "string", example: "/a/file.txt" },
          size: { type: "number", example: 123 },
        },
        required: ["path"],
      },

      WriteContentResponse: {
        type: "object",
        properties: { hash: { type: "string" }, size: { type: "number" } },
        required: ["hash", "size"],
      },

      FsNode: {
        type: "object",
        properties: {
          ownerId: { type: "string" },
          path: { type: "string" },
          kind: { type: "string", enum: ["dir", "file"] },
          createDate: { type: "string", format: "date-time" },
          updateDate: { type: "string", format: "date-time" },
          size: { type: "number" },
          blobHash: { type: "string" },
          readOnly: { type: "boolean" },
        },
        required: ["ownerId", "path", "kind", "createDate", "updateDate"],
      },

      ListNodesResponse: {
        type: "object",
        properties: {
          nodes: {
            type: "array",
            items: { $ref: "#/components/schemas/FsNode" },
          },
        },
        required: ["nodes"],
      },

      PatchReadOnlyRequest: {
        type: "object",
        properties: {
          path: { type: "string", example: "/docs" },
          readOnly: { type: "boolean", example: true },
        },
        required: ["path", "readOnly"],
      },

      // NEW: CWD
      SetCwdRequest: {
        type: "object",
        properties: { path: { type: "string", example: "/x/c" } },
        required: ["path"],
      },
      CwdResponse: {
        type: "object",
        properties: { cwd: { type: "string", example: "/" } },
        required: ["cwd"],
      },
    },
  },

  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean" } },
                  required: ["ok"],
                },
              },
            },
          },
        },
      },
    },

    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RegisterResponse" } },
            },
          },
          "400": {
            description: "Bad request",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "409": {
            description: "User exists",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login (returns accessToken, sets refresh cookie)",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } },
          },
          "400": {
            description: "Bad request",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": {
            description: "Invalid credentials",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token (cookie rt or body.refreshToken)",
        requestBody: {
          required: false,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RefreshRequest" } },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshResponse" } } },
          },
          "400": {
            description: "Missing refresh token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": {
            description: "Invalid auth",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout (clears refresh cookie, removes refresh token if provided)",
        requestBody: {
          required: false,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/LogoutRequest" } },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] },
              },
            },
          },
        },
      },
    },

    "/auth/logout-all": {
      post: {
        tags: ["Auth"],
        summary: "Logout all sessions for current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/fs/directories": {
      // NEW: list directory children (pagination)
      get: {
        tags: ["FS - Directories"],
        summary: "List directory children (non-recursive) with pagination",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "path", in: "query", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
          { name: "after", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ListNodesResponse" } } },
          },
          "400": {
            description: "Bad request",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": { description: "Unauthorized" },
          "404": {
            description: "Not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },

      post: {
        tags: ["FS - Directories"],
        summary: "Create directory",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreatePathRequest" } } },
        },
        responses: {
          "201": { description: "Created" },
          "400": {
            description: "Bad request",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": { description: "Unauthorized" },
          "409": { description: "Already exists" },
        },
      },

      delete: {
        tags: ["FS - Directories"],
        summary: "Delete directory (recursive)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreatePathRequest" } } },
        },
        responses: {
          "200": { description: "OK" },
          "400": {
            description: "Bad request",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },

    "/api/fs/directories/move": {
      post: {
        tags: ["FS - Directories"],
        summary: "Move directory (recursive)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MoveCopyRequest" } } },
        },
        responses: {
          "200": { description: "OK" },
          "400": { description: "Bad request" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
          "409": { description: "Target exists" },
        },
      },
    },

    "/api/fs/directories/copy": {
      post: {
        tags: ["FS - Directories"],
        summary: "Copy directory (recursive)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MoveCopyRequest" } } },
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Bad request" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
          "409": { description: "Target exists" },
        },
      },
    },

    "/api/fs/files": {
      post: {
        tags: ["FS - Files"],
        summary: "Create file",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateFileRequest" } } },
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Bad request" },
          "401": { description: "Unauthorized" },
          "409": { description: "Already exists" },
        },
      },

      delete: {
        tags: ["FS - Files"],
        summary: "Delete file",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreatePathRequest" } } },
        },
        responses: {
          "200": { description: "OK" },
          "400": { description: "Bad request" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },

    "/api/fs/files/move": {
      post: {
        tags: ["FS - Files"],
        summary: "Move file",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MoveCopyRequest" } } },
        },
        responses: {
          "200": { description: "OK" },
          "400": { description: "Bad request" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
          "409": { description: "Target exists" },
        },
      },
    },

    "/api/fs/files/copy": {
      post: {
        tags: ["FS - Files"],
        summary: "Copy file",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MoveCopyRequest" } } },
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Bad request" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
          "409": { description: "Target exists" },
        },
      },
    },

    "/api/fs/files/content": {
      get: {
        tags: ["FS - Files"],
        summary: "Read file content (binary)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "path", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Binary content",
            headers: { etag: { schema: { type: "string" } } },
            content: {
              "application/octet-stream": { schema: { type: "string", format: "binary" } },
            },
          },
          "400": {
            description: "Bad request",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },

      put: {
        tags: ["FS - Files"],
        summary: "Write file content (binary, max 10MB)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "path", in: "query", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/octet-stream": { schema: { type: "string", format: "binary" } },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/WriteContentResponse" } } },
          },
          "400": {
            description: "Bad request",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
          "413": {
            description: "Payload too large",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/fs": {
      get: {
        tags: ["FS - Nodes"],
        summary: "List nodes recursively under a directory",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "path", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/ListNodesResponse" } } } },
          "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },

    "/api/fs/info": {
      get: {
        tags: ["FS - Nodes"],
        summary: "Get node info",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "path", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { node: { $ref: "#/components/schemas/FsNode" } },
                  required: ["node"],
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },

    "/api/fs/read-only": {
      patch: {
        tags: ["FS - Nodes"],
        summary: "Set read-only flag on node",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PatchReadOnlyRequest" } } },
        },
        responses: {
          "200": { description: "OK" },
          "400": { description: "Bad request" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },

    // NEW: CWD ROUTES
    "/api/fs/cwd": {
      get: {
        tags: ["FS - Nodes"],
        summary: "Get working directory (cwd)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CwdResponse" } } },
          },
          "401": { description: "Unauthorized" },
        },
      },
      put: {
        tags: ["FS - Nodes"],
        summary: "Set working directory (cwd)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SetCwdRequest" } } },
        },
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CwdResponse" } } },
          },
          "400": {
            description: "Bad request",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
};

# Blob FS — Backend File System Provider

Backend‑only multi‑tenant virtual file system with content‑addressed blob storage (deduplicated files).
Frontend intentionally excluded — validation via API and tests.

---

## Tech Stack

- Node.js 18+
- TypeScript 5.9
- Express 5
- PostgreSQL 14+
- pg, node-pg-migrate
- JWT (access) + refresh token (httpOnly cookie)
- Vitest + Supertest
- Swagger (OpenAPI)

---

## Architecture

### Auth

- Register / Login / Refresh / Logout
- JWT access token
- Refresh token rotation + invalidation
- Multi‑session logout

### Metadata (Virtual FS)

- Hierarchical directories and files
- Per‑user isolation (multi‑tenant)
- Recursive move / copy / delete
- Read‑only nodes
- Pagination for directory listing
- CWD relative paths supported

### Blob Storage

- SHA‑256 content addressed storage
- Automatic deduplication
- Reference counting
- Orphan cleanup on delete

Metadata stored in PostgreSQL.
File content stored in `blobs` table and referenced by hash.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL (Docker)

Windows: open **PowerShell / Windows Terminal (Run as Administrator)**

Install Docker Desktop (if not installed):

```powershell
winget install -e --id Docker.DockerDesktop
```

Open Docker Desktop once and wait until it finishes starting.

Verify Docker:

```powershell
docker --version
docker ps
```

Run PostgreSQL container:

```powershell
docker run --name blobfs-postgres -e POSTGRES_USER=blobfs -e POSTGRES_PASSWORD=blobfs -e POSTGRES_DB=blobfs -p 5432:5432 -d postgres:16
```

Check container:

````powershell
docker ps
```bash
docker run --name blobfs-postgres -e POSTGRES_USER=blobfs -e POSTGRES_PASSWORD=blobfs -e POSTGRES_DB=blobfs -p 5432:5432 -d postgres:16
````

### 3. Environment (.env)

`.env` is already included in the repository (removed from .gitignore), so manual creation is not required. (for easy run its included passwords)

Values can still be edited if needed.

### 4. Run migrations

```bash
npm run db:migrate
```

---

## Run

```bash
npm run dev
```

Server:

```
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/health
```

Response:

```json
{ "ok": true }
```

---

## API Docs

Swagger UI:

```
http://localhost:3000/docs
```

OpenAPI schema:

```
http://localhost:3000/docs.json
```

---

## Testing

```bash
npm test
```

Tests cover authentication and filesystem behavior.

---

## Notes

- Backend‑only project
- Multi‑tenant isolation per user
- Files stored once (deduplicated by hash)
- Validation expected via API calls or automated tests

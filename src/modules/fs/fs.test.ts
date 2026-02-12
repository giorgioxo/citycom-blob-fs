import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app";

function binaryParser(res: any, callback: (err: any, body: Buffer) => void) {
  res.setEncoding("binary");
  let data = "";
  res.on("data", (chunk: string) => {
    data += chunk;
  });
  res.on("end", () => {
    callback(null, Buffer.from(data, "binary"));
  });
}

describe("FS full flow", () => {
  it("cwd + directories + files + content", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const username = `u_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const password = "password123";

    const reg = await agent.post("/auth/register").send({ username, password });
    expect(reg.status).toBe(201);

    const login = await agent.post("/auth/login").send({ username, password });
    expect(login.status).toBe(200);

    const accessToken: string = login.body.accessToken;
    expect(accessToken).toBeTruthy();

    const auth = { Authorization: `Bearer ${accessToken}` };

    const cwd0 = await agent.get("/api/fs/cwd").set(auth);
    expect(cwd0.status).toBe(200);
    expect(cwd0.body.cwd).toBe("/");

    const d1 = await agent.post("/api/fs/directories").set(auth).send({ path: "/x" });
    expect(d1.status).toBe(201);

    const d2 = await agent.post("/api/fs/directories").set(auth).send({ path: "/x/c" });
    expect(d2.status).toBe(201);

    const setCwd = await agent.put("/api/fs/cwd").set(auth).send({ path: "/x/c" });
    expect(setCwd.status).toBe(200);
    expect(setCwd.body.cwd).toBe("/x/c");

    const d3 = await agent.post("/api/fs/directories").set(auth).send({ path: "z" });
    expect(d3.status).toBe(201);

    const f1 = await agent.post("/api/fs/files").set(auth).send({ path: "test.txt" });
    expect(f1.status).toBe(201);

    const write = await agent.put("/api/fs/files/content").set(auth).query({ path: "test.txt" }).set("content-type", "application/octet-stream").send(Buffer.from("hello world", "utf8"));

    expect(write.status).toBe(200);
    expect(write.body.hash).toBeTruthy();
    expect(write.body.size).toBe(11);

    const read = await agent.get("/api/fs/files/content").set(auth).query({ path: "test.txt" }).buffer(true).parse(binaryParser);

    expect(read.status).toBe(200);
    expect(Buffer.isBuffer(read.body)).toBe(true);
    expect(read.body.toString("utf8")).toBe("hello world");

    const info = await agent.get("/api/fs/info").set(auth).query({ path: "test.txt" });
    expect(info.status).toBe(200);
    expect(info.body.node).toBeTruthy();
    expect(info.body.node.path).toBe("/x/c/test.txt");
    expect(info.body.node.name).toBe("test.txt");
    expect(info.body.node.mimeType).toBeTruthy();

    const list = await agent.get("/api/fs/directories").set(auth).query({ path: "/x/c" });
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.nodes)).toBe(true);

    const ro = await agent.patch("/api/fs/read-only").set(auth).send({ path: "/x/c", readOnly: true });
    expect(ro.status).toBe(200);

    const f2 = await agent.post("/api/fs/files").set(auth).send({ path: "fail.txt" });
    expect(f2.status).toBe(400);
  });
});

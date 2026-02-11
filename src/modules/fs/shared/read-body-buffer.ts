import type { Request } from "express";

export async function readBodyBuffer(req: Request, limitBytes: number): Promise<Buffer> {
  const contentLengthHeader = req.header("content-length");

  if (contentLengthHeader) {
    const n = Number(contentLengthHeader);
    if (!Number.isNaN(n) && n > limitBytes) throw new Error("payload too large");
  }

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let done = false;

    const finishReject = (err: unknown) => {
      if (done) return;
      done = true;
      reject(err);
    };

    const finishResolve = (buf: Buffer) => {
      if (done) return;
      done = true;
      resolve(buf);
    };

    req.on("aborted", () => finishReject(new Error("request aborted")));
    req.on("error", () => finishReject(new Error("invalid request body")));

    req.on("data", (c) => {
      const b = Buffer.isBuffer(c) ? c : Buffer.from(c);
      total += b.length;

      if (total > limitBytes) {
        finishReject(new Error("payload too large"));
        req.destroy();
        return;
      }

      chunks.push(b);
    });

    req.on("end", () => finishResolve(Buffer.concat(chunks)));
  });
}

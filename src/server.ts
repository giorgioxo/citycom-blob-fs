import { createApp } from "./app";

const PORT = Number(process.env.PORT ?? 3000);

export function startServer() {
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

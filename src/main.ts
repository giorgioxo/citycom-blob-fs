import express = require("express");

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(3000, () => {
  console.log("api listening on localhost:3-00");
});

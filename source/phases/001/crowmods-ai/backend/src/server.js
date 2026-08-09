const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "crowmods-backend" });
});

app.get("/api/releases", (_req, res) => {
  res.json({ releases: [] });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`CrowMods backend listening on ${port}`);
});

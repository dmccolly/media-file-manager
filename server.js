const express = require("express");
const path = require("path");
const compression = require("compression");

const app = express();
const buildDir = path.join(__dirname, "build");

app.use(compression());

app.use("/static", express.static(path.join(buildDir, "static"), { maxAge: "1h", etag: true }));
app.use("/assets", express.static(path.join(buildDir, "assets"), { maxAge: "1h", etag: true })); // (Vite-style if present)

app.get(["/manager", "/manager/*"], (req, res) => {
  res.type("html");
  res.sendFile(path.join(buildDir, "index.html"));
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.type("html");
  res.sendFile(path.join(buildDir, "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`▶ Listening on ${port}`));

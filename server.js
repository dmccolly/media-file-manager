const express = require("express");
const path = require("path");
const compression = require("compression");

const app = express();
const buildDir = path.join(__dirname, "build"); // change if your compiled app lives elsewhere

app.use(compression());

app.use("/static", express.static(path.join(buildDir, "static"), { maxAge: "1h", etag: true }));
app.use("/assets", express.static(path.join(buildDir, "assets"), { maxAge: "1h", etag: true })); // Vite-style

app.get("/public/hoibf-file-manager.html", (req, res) => {
  res.type("html"); // <— force text/html
  res.sendFile(path.join(__dirname, "public", "hoibf-file-manager.html"));
});

app.get(["/manager", "/manager/*"], (req, res) => {
  res.type("html"); // <— force text/html; charset=utf-8
  res.sendFile(path.join(buildDir, "index.html"));
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next(); // let APIs fall through
  res.type("html");
  res.sendFile(path.join(buildDir, "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`▶ Listening on ${port}`));

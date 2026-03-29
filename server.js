const http = require("node:http");
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const path = require("node:path");
const { handleContactRequest, handleSubmissionsRequest, sendJson } = require("./backend/contact-api");

const rootDir = __dirname;
const port = Number(process.env.PORT || 4173);

const contentTypes = new Map([
    [".css", "text/css; charset=utf-8"],
    [".gif", "image/gif"],
    [".html", "text/html; charset=utf-8"],
    [".ico", "image/x-icon"],
    [".jpeg", "image/jpeg"],
    [".jpg", "image/jpeg"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".png", "image/png"],
    [".svg", "image/svg+xml"],
    [".txt", "text/plain; charset=utf-8"],
    [".webm", "video/webm"],
    [".webp", "image/webp"],
    [".xml", "application/xml; charset=utf-8"]
]);

function isWithinRoot(filePath) {
    const relativePath = path.relative(rootDir, filePath);
    return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function getContentType(filePath) {
    return contentTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
}

async function fileExists(filePath) {
    try {
        const stats = await fsPromises.stat(filePath);
        return stats.isFile();
    } catch (error) {
        return false;
    }
}

async function resolveStaticFile(urlPath) {
    const safePath = decodeURIComponent(urlPath || "/");
    const trimmedPath = safePath.replace(/^\/+/, "");
    const candidates = [];

    if (!trimmedPath) {
        candidates.push("index.html");
    } else {
        candidates.push(trimmedPath);

        if (!path.extname(trimmedPath)) {
            candidates.push(`${trimmedPath}.html`);
            candidates.push(path.join(trimmedPath, "index.html"));
        }
    }

    for (const candidate of candidates) {
        const absolutePath = path.resolve(rootDir, candidate);
        if (!isWithinRoot(absolutePath)) {
            continue;
        }

        if (await fileExists(absolutePath)) {
            return absolutePath;
        }
    }

    return null;
}

function streamFile(res, filePath, statusCode = 200, method = "GET") {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", getContentType(filePath));

    if (method === "HEAD") {
        res.end();
        return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => {
        if (!res.headersSent) {
            sendJson(res, 500, {
                ok: false,
                message: "静态资源读取失败。"
            });
            return;
        }

        res.destroy();
    });
    stream.pipe(res);
}

async function serveStatic(req, res, pathname) {
    const filePath = await resolveStaticFile(pathname);

    if (filePath) {
        streamFile(res, filePath, 200, req.method);
        return;
    }

    const notFoundPage = path.join(rootDir, "404.html");
    if (await fileExists(notFoundPage)) {
        streamFile(res, notFoundPage, 404, req.method);
        return;
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("404 Not Found");
}

const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

    if (requestUrl.pathname === "/api/contact") {
        await handleContactRequest(req, res, {
            source: "local-node-server",
            storageDir: path.join(rootDir, "data")
        });
        return;
    }

    if (requestUrl.pathname === "/api/submissions") {
        await handleSubmissionsRequest(req, res, {
            storageDir: path.join(rootDir, "data")
        });
        return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
        sendJson(res, 405, {
            ok: false,
            message: "只支持 GET、HEAD 和 POST。"
        });
        return;
    }

    await serveStatic(req, res, requestUrl.pathname);
});

server.listen(port, () => {
    console.log(`Titan site with backend is running at http://127.0.0.1:${port}`);
});

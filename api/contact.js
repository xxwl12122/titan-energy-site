const path = require("node:path");
const { handleContactRequest } = require("../backend/contact-api");

module.exports = async (req, res) => handleContactRequest(req, res, {
    source: "vercel-api",
    storageDir: path.join(process.cwd(), "data")
});

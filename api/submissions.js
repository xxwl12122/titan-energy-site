const path = require("node:path");
const { handleSubmissionsRequest } = require("../backend/contact-api");

module.exports = async (req, res) => handleSubmissionsRequest(req, res, {
    storageDir: path.join(process.cwd(), "data")
});

const fs = require("fs");
const path = require("path");

module.exports.fetch_backend_version = [
  (req, res) => {
    try {
      const path_to_file = path.resolve("version.js");
      fs.stat(path_to_file, function (err, stats) {
        if (err) {
          res.status(404).send({ message: "Version details not found" });
        } else if (stats.isFile()) {
          const version_details = require("../../version");

          res.status(200).json({
            status: true,
            status_code: 200,
            data: version_details,
            message: "Version details fetched successfully",
          });
        }
      });
    } catch (err) {
      res.status(501).send({ message: "Error fetching version info." });
    }
  },
];

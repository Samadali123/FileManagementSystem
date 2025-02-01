const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["file", "folder"], required: true },
    path: { type: String, required: true, unique: true },
    parentPath: { type: String, required: true, default: "/" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);

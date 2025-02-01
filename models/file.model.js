const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    name: { 
      type: String, required: [true, "Filename is required"]
    },
    type: {
      type: String, enum: ["file", "folder"], required: [true, "File type is required"]
    },
    path: { 
      type: String, required: [true, "File path is required"], unique: true 
    },
    parentPath: {
      type: String, required: [true, "File parent path is required"], default: "/"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);

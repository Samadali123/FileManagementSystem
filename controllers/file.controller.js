const File = require("../models/file.model");


// print hello
exports.printHello = (req, res)=>{
  res.status(200).send("Hello, world!");
};



// Create File/Folder
exports.create = async (req, res) => {
  try {
    const { name, type, parentPath } = req.body;

    // Check for missing required fields
    if (!name || !type || !parentPath) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate file type
    const validTypes = ["file", "folder"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid file type" });
    }

    // Normalize parent path
    const normalizedParent = parentPath.endsWith("/") ? parentPath : `${parentPath}/`;
    const path = `${normalizedParent}${name}/`;

    // Check if file/folder already exists
    const exists = await File.findOne({ path });
    if (exists) {
      return res.status(400).json({ error: "File/Folder already exists" });
    }

    // Create new file/folder
    const newFile = new File({ name, type, path, parentPath: normalizedParent });
    await newFile.save();

    res.status(201).json({ message: "Created successfully", data: newFile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rename File/Folder
exports.rename = async (req, res) => {
  try {
    const { oldPath, newName } = req.body;

    // Check for missing required fields
    if (!oldPath || !newName) {
      return res.status(400).json({ error: "Missing required fields: oldPath and newName are required." });
    }

    const item = await File.findOne({ path: oldPath });
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Check if newName is valid (not empty and doesn't contain invalid characters)
    if (!newName || newName.trim() === "") {
      return res.status(400).json({ error: "Invalid new name provided." });
    }

    const newPath = item.parentPath === "/" ? `/${newName}/` : `${item.parentPath}${newName}/`;

    // Check if a file/folder with the new path already exists
    const exists = await File.findOne({ path: newPath });
    if (exists) {
      return res.status(400).json({ error: "A file/folder with the new name already exists." });
    }

    // Rename main item
    await File.updateOne({ path: oldPath }, { name: newName, path: newPath });

    // Update all child items
    await File.updateMany(
      { parentPath: oldPath },
      { $set: { parentPath: newPath } }
    );

    res.json({ message: "Renamed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Move File/Folder
exports.move = async (req, res) => {
  try {
    const { oldPath, newParentPath } = req.body;

    // Validate required fields
    if (!oldPath || !newParentPath) {
      return res.status(400).json({ error: "Both 'oldPath' and 'newParentPath' are required." });
    }

    const item = await File.findOne({ path: oldPath });
    if (!item) {
      return res.status(404).json({ error: "The specified item was not found." });
    }

    // Ensure the new parent path is different from the old path
    if (newParentPath === oldPath) {
      return res.status(400).json({ error: "The item cannot be moved to its current location." });
    }

    const normalizedNewParent = newParentPath.endsWith("/") ? newParentPath : `${newParentPath}/`;
    const newPath = `${normalizedNewParent}${item.name}/`;

    // Check for existing file/folder at the new path
    const exists = await File.findOne({ path: newPath });
    if (exists) {
      return res.status(400).json({ error: "A file or folder already exists at the specified new path." });
    }

    // Update the main item
    await File.updateOne({ path: oldPath }, { path: newPath, parentPath: normalizedNewParent });

    // Update child items
    const children = await File.find({ parentPath: oldPath });
    for (const child of children) {
      const updatedChildPath = child.path.replace(oldPath, newPath);
      await File.updateOne({ path: child.path }, { path: updatedChildPath, parentPath: newPath });
    }

    res.json({ message: "The item has been moved successfully." });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while moving the item: " + error.message });
  }
};

// Copy File/Folder
exports.copy = async (req, res) => {
  try {
    const { sourcePath, destinationPath } = req.body;

    // Check for missing required fields
    if (!sourcePath || !destinationPath) {
      return res.status(400).json({ error: "Missing required fields: sourcePath and destinationPath are required." });
    }

    const item = await File.findOne({ path: sourcePath });
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Validate destinationPath
    if (sourcePath === destinationPath) {
      return res.status(400).json({ error: "Cannot copy item to the same location." });
    }

    const normalizedDestination = destinationPath.endsWith("/") ? destinationPath : `${destinationPath}/`;
    const newPath = `${normalizedDestination}${item.name}/`;

    // Check if a file/folder with the new path already exists
    const exists = await File.findOne({ path: newPath });
    if (exists) {
      return res.status(400).json({ error: "A file/folder with the destination path already exists." });
    }

    const copiedItem = new File({ ...item.toObject(), path: newPath, parentPath: normalizedDestination });
    await copiedItem.save();

    // Copy children
    const children = await File.find({ parentPath: sourcePath });
    for (const child of children) {
      const updatedChildPath = child.path.replace(sourcePath, newPath);
      const copiedChild = new File({ ...child.toObject(), path: updatedChildPath, parentPath: newPath });
      await copiedChild.save();
    }

    res.json({ message: "Copied successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete File/Folder
exports.delete = async (req, res) => {
  try {
    const { path } = req.body;

    // Check for missing required fields
    if (!path) {
      return res.status(400).json({ error: "Missing required field: path is required." });
    }

    // Check if the item exists before attempting to delete
    const item = await File.findOne({ path });
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Delete the item
    await File.deleteOne({ path });

    // Find and delete children
    const children = await File.find({ parentPath: path });
    if (children.length > 0) {
      for (const child of children) {
        await File.deleteOne({ path: child.path });
      }
    }

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

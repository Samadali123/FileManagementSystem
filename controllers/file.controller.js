const File = require("../models/file.model");


// print hello
exports.printHello = (req, res)=>{
  res.status(200).send("Hello, world!");
};



// Create File/Folder
exports.create = async (req, res) => {
  try {
    const { name, type, parentPath } = req.body;

    if (!name || !type || !parentPath) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const normalizedParent = parentPath.endsWith("/") ? parentPath : `${parentPath}/`;
    const path = `${normalizedParent}${name}/`;

    const exists = await File.findOne({ path });
    if (exists) return res.status(400).json({ error: "File/Folder already exists" });

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

    const item = await File.findOne({ path: oldPath });
    if (!item) return res.status(404).json({ error: "Item not found" });

    const newPath = item.parentPath === "/" ? `/${newName}/` : `${item.parentPath}${newName}/`;

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

    const item = await File.findOne({ path: oldPath });
    if (!item) return res.status(404).json({ error: "Item not found" });

    const normalizedNewParent = newParentPath.endsWith("/") ? newParentPath : `${newParentPath}/`;
    const newPath = `${normalizedNewParent}${item.name}/`;

    // Update main item
    await File.updateOne({ path: oldPath }, { path: newPath, parentPath: normalizedNewParent });

    // Update children
    const children = await File.find({ parentPath: oldPath });
    for (const child of children) {
      const updatedChildPath = child.path.replace(oldPath, newPath);
      await File.updateOne({ path: child.path }, { path: updatedChildPath, parentPath: newPath });
    }

    res.json({ message: "Moved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Copy File/Folder
exports.copy = async (req, res) => {
  try {
    const { sourcePath, destinationPath } = req.body;

    const item = await File.findOne({ path: sourcePath });
    if (!item) return res.status(404).json({ error: "Item not found" });

    const normalizedDestination = destinationPath.endsWith("/") ? destinationPath : `${destinationPath}/`;
    const newPath = `${normalizedDestination}${item.name}/`;

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

    await File.deleteOne({ path });

    const children = await File.find({ parentPath: path });
    for (const child of children) {
      await File.deleteOne({ path: child.path });
    }

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

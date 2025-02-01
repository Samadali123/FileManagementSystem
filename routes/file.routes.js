
const fileController = require("../controllers/file.controller");

module.exports = (app)=>{
app.get("/",  fileController.printHello)
app.post("/api/files/create", fileController.create);
app.put("/api/files/rename", fileController.rename);
app.put("/api/files/move", fileController.move);
app.post("/api/files/copy", fileController.copy);
app.delete("/api/files/delete", fileController.delete);
}


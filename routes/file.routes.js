
const fileController = require("../controllers/file.controller");

module.exports = (app)=>{
app.get("/",  fileController.printHello)
app.post("/create", fileController.create);
app.put("/rename", fileController.rename);
app.put("/move", fileController.move);
app.post("/copy", fileController.copy);
app.delete("/delete", fileController.delete);
}


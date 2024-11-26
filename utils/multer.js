const multer = require("multer");
const path = require("path");


const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "storage"); 
  },
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname); 
    const filename = path.basename(file.originalname, fileExtension); 

    callback(null, `${filename}-${uniqueSuffix}${fileExtension}`);
  },
});

const upload = multer({ storage });

module.exports = upload;

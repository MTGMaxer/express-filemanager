const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const formidable = require("formidable");
const handlebars = require("express-handlebars");

// TODO attribute
const PORT = process.env.PORT || 3000;
const app = express();

const supportedExtensions = ["docx", "jpg", "pdf", "png", "txt"];

app.use(bodyParser.urlencoded({ extended: true }));
app.engine("hbs", handlebars({
    extname: "hbs",
    helpers: {
        extImage(filename) {
            let fileExt = "default";
            let periodPos = filename.lastIndexOf(".");
            if (periodPos >= 0) {
                let ext = filename.substring(periodPos + 1);
                if (supportedExtensions.includes(ext)) {
                    fileExt = ext;
                }
            }
            return `img/extensions/${fileExt}.svg`;
        },
    },
}));
app.set("view engine", "hbs");
app.listen(PORT);

function uploadPage(req, res) {
    res.render("upload");
}

app.get("/", uploadPage);
app.get("/upload", uploadPage);

let fileCounterId = 0;
let uploadedFiles = [];

app.get("/filemanager", (req, res) => {
    res.render("filemanager", { files: uploadedFiles });
});

app.post("/uploadFiles", (req, res) => {
    let form = formidable({
        uploadDir: path.join(__dirname, "/static/upload"),
        keepExtensions: true,
        multiples: true,
    });
    form.parse(req, (err, fields, files) => {
        let { fileupload } = files;
        if (Array.isArray(fileupload)) {
            files.fileupload.forEach(saveFileData);
        } else {
            saveFileData(fileupload);
        }
        res.redirect("/filemanager");
    });
});

app.post("/clearFileTable", (req, res) => {
    uploadedFiles = [];
    res.redirect("/filemanager");
});

app.post("/deleteFile", (req, res) => {
    let fileId = parseInt(req.body.fileid);
    let fileIndex = uploadedFiles.findIndex((file) => file.id === fileId);

    if (fileIndex >= 0) {
        uploadedFiles.splice(fileIndex, 1);
    }
    res.redirect("/filemanager");
});

app.get("/info", (req, res) => {
    let fileId = parseInt(req.query.id);
    let fileToShow = uploadedFiles.find((file) => file.id === fileId);
    if (fileToShow) {
        res.render("info", fileToShow);
    } else {
        res.status(404).send("File not found");
    }
});

app.get("/downloadFile", (req, res) => {
    let fileId = parseInt(req.query.id);
    let fileToDownload = uploadedFiles.find((file) => file.id === fileId);
    if (fileToDownload) {
        res.download(fileToDownload.path, fileToDownload.name);
    } else {
        res.status(404).send("File not found");
    }
});

function saveFileData(file) {
    uploadedFiles.push({
        id: fileCounterId++,
        name: file.name,
        path: file.path,
        size: file.size,
        type: file.type,
        savedate: file.lastModifiedDate,
    });
}

app.use(express.static("static"));

app.use((req, res) => {
    res.sendStatus(404);
});

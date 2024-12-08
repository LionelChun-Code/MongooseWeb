const fs = require('fs');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
require('dotenv').config();

// Function to check the file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

// Function to create storage engine
function createStorage(destination) {
  return multer.diskStorage({
    destination: function(req, file, cb) {
      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
      }
      cb(null, destination);
    },
    filename: function(req, file, cb) {
      const ext = path.extname(file.originalname) || '.' + file.mimetype.split('/')[1];
      const filename = file.fieldname + '-' + Date.now() + ext;
      cb(null, filename);
    }
  });
}

// Initialize upload with dynamic storage
function createUpload(destination, fieldName) {
  const storage = createStorage(destination);
  return multer({
    storage: storage,
    limits: { fileSize: 1000000 },
    fileFilter: function(req, file, cb) {
      checkFileType(file, cb);
    }
  }).single(fieldName);
}

// Function to create thumbnails with dynamic paths
async function createThumbnail(req, res, next, thumbnailPath) {
  if (req.file) {
    const ext = path.extname(req.file.originalname) || '.' + req.file.mimetype.split('/')[1];
    const filename = req.file.filename;
    const thumbnailFullPath = path.join(thumbnailPath, filename);

    if (!fs.existsSync(thumbnailPath)) {
      fs.mkdirSync(thumbnailPath, { recursive: true });
    }

    try {
      await sharp(req.file.path)
        .resize(200, 200)
        .toFile(thumbnailFullPath);
      
      req.file.thumbnail = filename;
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'An error occurred while creating the thumbnail.' });
    }
  }
  next();
}

module.exports = { createUpload, createThumbnail };

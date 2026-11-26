const express = require('express');
const documentsController = require('../controllers/documents.controller');
const { uploadSingleFile } = require('../controllers/upload.middleware');

const router = express.Router();

router.post('/upload', documentsController.validateOwner, uploadSingleFile, documentsController.upload);
router.get('/documents', documentsController.list);
router.get('/documents/:id/download', documentsController.download);

module.exports = router;

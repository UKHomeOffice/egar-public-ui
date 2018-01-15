'use strict';
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const uuid = require('uuid/v1');
const fs = require('fs');

const config = require('../config')();

const storageOpts = config['file-upload-storage-options'];
const storageType = config['file-upload-storage-type'];
let storage;

if (storageType === 's3') {
    aws.config.update(config['file-upload-aws-config']);
    const s3 = new aws.S3();
    storageOpts.s3 = s3;
    storageOpts.key = (request, file, cb) => {
        const newName = `${uuid()}/${file.originalname}`;
        cb(null, newName);
    };
    storage = multerS3(storageOpts);
} else if (storageType === 'local') {
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = `/tmp/${uuid()}`;
            fs.mkdir(dir, null, err => {
                cb(err, dir);
            });
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname);
        }
    });
}

const upload = multer({
    storage: storage,
}).single('egar-supporting-files-upload');

const handler = (req, res, next) => {
    if (req.method === 'POST') {
        upload(req, res, next);
    } else {
        next();
    }
};

module.exports = {
    uri: '/egar/upload-files',
    handler: handler
};

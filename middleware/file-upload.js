'use strict';
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const uuid = require('uuid/v1');
const fs = require('fs');

const config = require('../config')();
const log = config.logger;

const storageOpts = config['file-upload-storage-options'];
const storageType = config['file-upload-storage-type'];

const FILE_TOO_LARGE = 'LIMIT_FILE_SIZE';
const FILE_FORMAT_ERR = 'file-format';
const FILE_SIZE_ERR = 'max-file-size';

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
    limits: {
        fileSize: config['file-upload-max-file-size']
    },
    fileFilter: (req, file, cb) => {
        if (!config['file-upload-file-types'].includes(file.mimetype)) {
            req.session.fileError = FILE_FORMAT_ERR;
            cb(null, false);
        } else {
            cb(null, true);
        }
    }
}).single('egar-supporting-files-upload');

const handler = (req, res, next) => {
    if (req.method === 'POST') {
        upload(req, res, err => {
            if (err && err.code === FILE_TOO_LARGE) {
                req.session.fileError = FILE_SIZE_ERR;
                next();
            } else {
                log.error(err);
                next(err);
            }
        });
    } else {
        next();
    }
};

module.exports = {
    uri: '/egar/upload-files',
    handler: handler
};

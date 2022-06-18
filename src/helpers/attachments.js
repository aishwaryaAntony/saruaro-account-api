import {
    S3_USER_BUCKET_NAME, S3_INSURANCE_BUCKET_NAME, S3_BUCKET_KMS_ARN
} from "../helpers/constants";
import path from "path";
const fs = require('fs');

var aws = require('aws-sdk');
var multer = require('multer');
var multerS3 = require('multer-s3');
var s3 = new aws.S3();

/**
*  Upload user image to s3
*/

const storageLocal = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(__dirname, '../../uploads'))
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + "" + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storageLocal });


module.exports = {
    upload: upload,

    /**
    *  upload document or image to aws s3
    */
    uploadDocument: (file, bucket) => {
        return new Promise(async (resolve, reject) => {
            fs.readFile(file.path, async function (err, data) {
                let key = Date.now() + '-' + file.originalname;

                let params = {
                    Bucket: bucket,
                    Key: key,
                    Body: data,
                    ServerSideEncryption: 'aws:kms',
                    SSEKMSKeyId: S3_BUCKET_KMS_ARN
                };
                s3.putObject(params, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        fs.unlink(file.path, function (err) {
                            if (err) {
                                console.error(err);
                            }
                        });
                        resolve(key);
                    }
                });
            });
        });
    },
    uploadBase64Image: (base64String, bucket) => {
        return new Promise(async (resolve, reject) => {
            const buf = Buffer.from(
                base64String.replace(/^data:image\/\w+;base64,/, ''),
                'base64',
            );
            let key = Date.now() + ".jpg"
            const params = {
                Key: key,
                Body: buf,
                Bucket: bucket,
                ContentEncoding: 'base64',
                ContentType: 'image/jpeg',
                ServerSideEncryption: 'aws:kms',
                SSEKMSKeyId: S3_BUCKET_KMS_ARN
            };
            s3.putObject(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(key);
                }
            });
        });
    },
    /**
    *  delete document and image from s3
    */
    deleteDocument: (storageKey, user) => {
        return new Promise(async (resolve, reject) => {
            let bucketName = user === true ? S3_USER_BUCKET_NAME : S3_INSURANCE_BUCKET_NAME;
            s3.deleteObject({
                Bucket: bucketName,
                Key: storageKey
            }, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        });
    },

    /**
     *  fetch document and image from s3
    */
    getImage: (params) => {
        return new Promise(async (resolve, reject) => {
            s3.getObject(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
}

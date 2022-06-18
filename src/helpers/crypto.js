var crypto = require('crypto');
import { ENCRYPTION_KEY, IV_LENGTH } from "./constants"

export default {
    /**
    *  encrypt string from parameter
    */
    encrypt(text) {
        return new Promise(async (resolve, reject) => {
            let iv = crypto.randomBytes(IV_LENGTH);
            let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
            let encrypted = cipher.update(text.toString());
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            resolve(iv.toString('base64') + ',' + encrypted.toString('base64'))
        });
    },
    /**
    *  decrypt string from parameter
    */
    decrypt(text) {
        return new Promise(async (resolve, reject) => {
            let textParts = text.split(',');
            let iv = Buffer.from(textParts.shift(), 'base64');
            let encryptedText = Buffer.from(textParts.join(','), 'base64');
            let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            resolve(decrypted.toString())
        });
    },
    /**
    *  hash string from parameter
    */
    hash_from_string(text) {
        return new Promise(async (resolve, reject) => {
            let data = text.toString();
            let hash = crypto.createHmac("sha256", ENCRYPTION_KEY).update(data).digest('base64');
            resolve(hash)
        })
    }
}
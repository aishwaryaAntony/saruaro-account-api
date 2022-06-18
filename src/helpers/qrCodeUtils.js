

import QRCode from "qrcode";
import { asynchronously_send_email_with_attachment } from "./emailUtils";


module.exports = {
    createAndSendQRCode: (localPath, body)=> {
        return new Promise(async (resolve, reject) => {
            try {
                const { qrCode, email, name, first_name, last_name } = body;
                QRCode.toFile(localPath, qrCode, { type: 'png' }, async function (err) {
                    if (err) throw err
                    console.log('done');
                    let data = {};
                    data.fileName = `${name.replace(/\s/g,'')}_QRCode.png`;
                    let currentResult = await asynchronously_send_email_with_attachment("QRCODE", email, first_name, data, localPath);
                    resolve(currentResult);
                });
            } catch (error) {
                resolve(null);
            }
        });
    }
}
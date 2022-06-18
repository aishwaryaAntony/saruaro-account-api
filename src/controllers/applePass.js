import db from '../models';
var path = require("path");
const { Template } = require("@walletpass/pass-js");
import { TEAM_IDENTIFIER, PASS_TYPE_IDENTIFIER } from "../helpers/constants";
import { findContactUsingQRCode } from "../helpers/salesForceUtils";
import moment from 'moment';

const template = new Template("generic", {
    passTypeIdentifier: PASS_TYPE_IDENTIFIER,
    teamIdentifier: TEAM_IDENTIFIER,
    backgroundColor: "#345C8C",
    sharingProhibited: true,
    organizationName: "Saguaro Bloom",
    labelColor: "#000",
    // logoText: "Saguaro Bloom Lab",
    foregroundColor: "#6892C3"
});

template.setCertificate(`-----BEGIN CERTIFICATE-----
MIIF8TCCBNmgAwIBAgIIWc0UMtn0KDowDQYJKoZIhvcNAQEFBQAwgZYxCzAJBgNV
BAYTAlVTMRMwEQYDVQQKDApBcHBsZSBJbmMuMSwwKgYDVQQLDCNBcHBsZSBXb3Js
ZHdpZGUgRGV2ZWxvcGVyIFJlbGF0aW9uczFEMEIGA1UEAww7QXBwbGUgV29ybGR3
aWRlIERldmVsb3BlciBSZWxhdGlvbnMgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkw
HhcNMjExMTExMDQ1NDU4WhcNMjIxMTExMDQ1NDU3WjCBljErMCkGCgmSJomT8ixk
AQEMG3Bhc3MuY29tLmtlbmxhc3lzdGVtcy5ibG9vbTEyMDAGA1UEAwwpUGFzcyBU
eXBlIElEOiBwYXNzLmNvbS5rZW5sYXN5c3RlbXMuYmxvb20xEzARBgNVBAsMCkJM
NzhaNDM0ODIxETAPBgNVBAoMCE9wdGl3aXNlMQswCQYDVQQGEwJVUzCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAMxYS6kT0VpzRI6cDurfhpNvboacwgbk
MRhYZYJbcuSHBOYQIeUpRj57DYsSoq89TGYqxJeacdrIleO0pHAr2zY5rWXzJ/5J
P1C3IhzXX5uRzxyjDyZZ4jZbQ0izk33lmj5/hk9v2mXcMJ2Y3T9Gp5McBpXHlNJn
S3PLtnG8EN9G78kyfV76e6W4jc8BbHynkiW/PlsxyaWWH+SV4uRJNonCaP44PxR9
NCOKD6E/2LW/4t/SOWRH+ZcYocXJTpsVUoF1/mNmbRj5CT6TcaS9kEP/YnlWWxP/
xSwkSGfUHsqEa2MxVjM1EPH+L1BrQrR1SpIE/XpBFPDJyoQzSm6CelsCAwEAAaOC
Aj8wggI7MAkGA1UdEwQCMAAwHwYDVR0jBBgwFoAUiCcXCam2GGCL7Ou69kdZxVJU
o7cwPQYIKwYBBQUHAQEEMTAvMC0GCCsGAQUFBzABhiFodHRwOi8vb2NzcC5hcHBs
ZS5jb20vb2NzcC13d2RyMDMwggEPBgNVHSAEggEGMIIBAjCB/wYJKoZIhvdjZAUB
MIHxMCkGCCsGAQUFBwIBFh1odHRwOi8vd3d3LmFwcGxlLmNvbS9hcHBsZWNhLzCB
wwYIKwYBBQUHAgIwgbYMgbNSZWxpYW5jZSBvbiB0aGlzIGNlcnRpZmljYXRlIGJ5
IGFueSBwYXJ0eSBhc3N1bWVzIGFjY2VwdGFuY2Ugb2YgdGhlIHRoZW4gYXBwbGlj
YWJsZSBzdGFuZGFyZCB0ZXJtcyBhbmQgY29uZGl0aW9ucyBvZiB1c2UsIGNlcnRp
ZmljYXRlIHBvbGljeSBhbmQgY2VydGlmaWNhdGlvbiBwcmFjdGljZSBzdGF0ZW1l
bnRzLjAeBgNVHSUEFzAVBggrBgEFBQcDAgYJKoZIhvdjZAQOMDAGA1UdHwQpMCcw
JaAjoCGGH2h0dHA6Ly9jcmwuYXBwbGUuY29tL3d3ZHJjYS5jcmwwHQYDVR0OBBYE
FG8uVtPUP6/2mUffL+l0GlJLqCs+MAsGA1UdDwQEAwIHgDAQBgoqhkiG92NkBgMC
BAIFADArBgoqhkiG92NkBgEQBB0MG3Bhc3MuY29tLmtlbmxhc3lzdGVtcy5ibG9v
bTANBgkqhkiG9w0BAQUFAAOCAQEAMMYZPrt1kQ4z+JnMAxcwVGewwvluQEaO+uNc
PSUzZGYlEVU8ilhhGHsAwqTLsC03PVN/Vk2+XZQ1nysQaBCkpoSPi9UzIIlI7rT7
hyzhp+pMp3GKYyC5q8FrNnkzekEPWXdGv88ElHQ0yDrjGjszUtsSmZgVHhd+fGFx
B/rBU2XH6ZNTU7mwkwXcxiyb89mByZK0c+zK7kLygyr1iftH22blZpcp6YJC1Qvo
BJNzS7y7D/KLd1YtDK182G4oJLDutT/pESBpB3ziiMc4DhctABHHVMQk9U512FiA
ZNYegw2Uw16XM2DHiqiANTeIr09aTLfTGnU+kKULDzJ38LTbSQ==
-----END CERTIFICATE-----`);
template.setPrivateKey(`-----BEGIN PRIVATE KEY-----
MIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDMWEupE9Fac0SO
nA7q34aTb26GnMIG5DEYWGWCW3LkhwTmECHlKUY+ew2LEqKvPUxmKsSXmnHayJXj
tKRwK9s2Oa1l8yf+ST9QtyIc11+bkc8cow8mWeI2W0NIs5N95Zo+f4ZPb9pl3DCd
mN0/RqeTHAaVx5TSZ0tzy7ZxvBDfRu/JMn1e+nuluI3PAWx8p5Ilvz5bMcmllh/k
leLkSTaJwmj+OD8UfTQjig+hP9i1v+Lf0jlkR/mXGKHFyU6bFVKBdf5jZm0Y+Qk+
k3GkvZBD/2J5VlsT/8UsJEhn1B7KhGtjMVYzNRDx/i9Qa0K0dUqSBP16QRTwycqE
M0pugnpbAgMBAAECggEAEPMR84hNSS9edGXFZv37b6dCh6/g+CldWSOb5+Al+4an
hV25MgTmarBSQ0Lcc6Sl/aN2gwywfPE+XZDSQuugVzMZiudMXe89bTiDf9jteT3y
6/EqhIfYF6IiRpl+lmbBEIYLYfNpLiHBdpEDaQg3RiCA+1N+qKUgwQ4Yp/5td9eI
cBbzYN8Yd/JNYzHVyjKX/JG6PyAnlhSwvWs4YaM8fwxTk2FPXY9rfZzQyCHPqjF8
uSw6qIgLeDRuxjtS7i4ZDor6PfrnTT6FkRP2sAFDCpHVumZi8WEVMEmmLTjGJw0I
HggdVMZdCuRLyUdMwn9K1aSUh5UKL0j5zKy2iXGDAQKBgQDzWZlHE6bOEe3uIJh2
PppGd+UfgbWMyDskQiaQTz/ss8WW9WmVpcnQkGncaaTJp37klKCn3PWgUL2dsQ/a
7H6PvPI2cvJybCU+RMOCGjoVNFNxtOzA4FtMpHbdBSM+5Yq1z14dViHHhUXMgqjm
TkRifjGq0B21mzaULqN7IcgqIQKBgQDW96IXOI+0x9culiV6SndvgnIBbE3FJFv6
+FXOrhumCA5nbbviL6cYXWzBZRHup7lqS4aIc2pFrBT9LIyQbq6IJziVOLwQ5XEk
GHHyvrINz/XE3XX4xsLdz4CoqQD2ge3hgzy90EfB7MBcIvJ9F3LGUIJogiEHWTGV
YqEtYpOs+wJ/Xw6g0SLcBaL7TglthMLvgJdU6PnB8TxF3eP5LGXIkq2mgVFb7RjV
vKKst2yM8jh7WM618txdFkJzzyVbDClVRtCHzL0Z95hG9AvoUunrxlyqO8Bwuubo
wwd7Ztqa6fbAOETIfq0mhMmKeliPoWbxT4f73r1s3YPDzh5pva90gQKBgDwDNgU1
jSjzAWfIEv5o+57t09YB3lRDKkqOOaZRhPZ9GUhWojUrCIMM0efLx43Q1TqPiydc
0TZSLCnh3fwUajUofetqw1YUN9nT2TvjcOHaRMqI6P5ivtQdsdVkGRi4fSiP8s0q
8F17MtiGCRxTB3/FyiJS8dWTWPxTZJu/AWsxAoGBAJgVTcWrHjQAreikRUWepikv
MWIzG7murfqduSUKsna7IcG1EfabrY5rYRm6JaNxp92eMeGhC4dHv9uN929lgGJG
wPHNc3E6VGY5zmvMAaidRB/fLWk/UO6dIap+SnNK35824sxZ3piYOZU+CPm9oGzI
v02aQuEMecxQCj9dhlzW
-----END PRIVATE KEY-----`);

exports.apple_pass = async (req, res, next) => {
    try {

        let year = moment().add(10, 'years').format('YYYY')
        let month = moment().add(10, 'months').format('MM')
        let days = moment().add(10, 'days').format('DD')
        let { qr_code } = req.body;

        let find_user_profile = await db.UserProfile.findOne({
            where: {
                qr_code: qr_code
            }
        });

        let userName = '';
        if (find_user_profile === null) {
            // return res.status(200).json({
            //     status: "failed",
            //     payload: null,
            //     message: "invalid User",
            // });

            let fetchContact = await findContactUsingQRCode(qr_code);
            if (fetchContact.totalSize > 0) {
                userName = fetchContact.records[0].Name;
                let constructUserProfile = {};
                constructUserProfile.first_name = fetchContact.records[0].Name;
                constructUserProfile.last_name = "";
                constructUserProfile.qr_code = fetchContact.records[0].QR_Code__c;
                constructUserProfile.birth_date = fetchContact.records[0].Birthdate;
                find_user_profile = constructUserProfile;
            }
        } else {
            userName = `${find_user_profile.first_name} ${find_user_profile.last_name}`;
        }

        if (find_user_profile.qr_code === null) {
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "invalid Qr",
            });
        }

        await template.images.add("icon", path.join(__dirname, "../images", "icon.png"));
        await template.images.add("logo", path.join(__dirname, "../images", "logo.png"));
        //await template.images.add("strip", path.join(__dirname, "../images", "strip.png"));

        const pass = template.createPass({
            serialNumber: "123456",
            description: "Bloom Lab Pass"
        });


        //pass.headerFields.add({ key: "header", label: "sss", value: "Saguaro" })
        if (find_user_profile.birth_date !== null) {

        }
        pass.primaryFields.add({ key: "new", label: "", value: "BLOOM LABS" });
        pass.secondaryFields.add({ key: "name", label: "NAME", value: userName });
        pass.auxiliaryFields.add({ key: "dat", label: "DATE OF BIRTH", value: moment.utc(find_user_profile.birth_date).format('MM/DD/YYYY') });
        pass.auxiliaryFields.add({ key: "info", label: "INFORMATION", value: "Your Personal Qr Code" });
        pass.expirationDate = new Date(parseInt(year), parseInt(month), parseInt(days), 10, 0);
        pass.barcodes = [
            {
                message: find_user_profile.qr_code,
                format: 'PKBarcodeFormatQR',
                messageEncoding: 'iso-8859-1',
                //altText: find_user_profile.last_name
            }
        ]
        console.log(pass);
        const body = await pass.asBuffer();
        res.type('application/vnd.apple.pkpass');
        res.send(body)


    } catch (error) {
        console.log("Error at apple pass ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while apple pass",
        });
    }
}
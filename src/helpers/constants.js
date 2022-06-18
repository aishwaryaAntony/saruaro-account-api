require('dotenv').config()

module.exports = {
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
    IV_LENGTH: 16,
    OTP_LENGTH: 6,
    NODE_ENV: process.env.NODE_ENV,
    TEAM_IDENTIFIER: process.env.TEAM_IDENTIFIER,
    PASS_TYPE_IDENTIFIER: process.env.PASS_TYPE_IDENTIFIER,
    SALESFORCE_LOGIN_URL: process.env.NODE_ENV === 'production' ? process.env.PROD_SALESFORCE_LOGIN_URL : process.env.QA_SALESFORCE_LOGIN_URL,
    SALESFORCE_CLIENT_SECRET: process.env.NODE_ENV === 'production' ? process.env.PROD_SALESFORCE_CLIENT_SECRET : process.env.QA_SALESFORCE_CLIENT_SECRET,
    SALESFORCE_CLIENT_ID: process.env.NODE_ENV === 'production' ? process.env.PROD_SALESFORCE_CLIENT_ID  : process.env.QA_SALESFORCE_CLIENT_ID,
    SALESFORCE_USER_EMAIL: process.env.NODE_ENV === 'production' ? process.env.PROD_SALESFORCE_CLIENT_EMAIL  : process.env.QA_SALESFORCE_CLIENT_EMAIL,
    SALESFORCE_SECURITY_PASSWORD:  process.env.NODE_ENV === 'production' ? `${process.env.PROD_SALESFORCE_PASSWORD}${process.env.PROD_SALESFORCE_SECRET_TOKEN}` : `${process.env.QA_SALESFORCE_PASSWORD}${process.env.QA_SALESFORCE_SECRET_TOKEN}`,
    TWILIO_FROM_PHONE: process.env.TWILIO_FROM_PHONE,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    S3_USER_BUCKET_NAME: process.env.S3_USER_BUCKET_NAME,
    S3_INSURANCE_BUCKET_NAME: process.env.S3_INSURANCE_BUCKET_NAME,
    S3_BUCKET_KMS_ARN: process.env.S3_BUCKET_KMS_ARN,
    S3_BUCKETS: [
        { bucketName: process.env.S3_USER_BUCKET_NAME, code: "u" },
        { bucketName: process.env.S3_INSURANCE_BUCKET_NAME, code: "i" },
    ],
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_EMAIL_PASSWORD: process.env.ADMIN_EMAIL_PASSWORD,
    TEST_RESULT_EMAIL: process.env.TEST_RESULT_EMAIL,
    TEST_RESULT_EMAIL_PASSWORD: process.env.TEST_RESULT_EMAIL_PASSWORD,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    CLIENT_DOMAIN: process.env.NODE_ENV === 'production' ? "https://prod.sonorashield.com/" : "https://sonorashield.com/",
    ACCOUNT_API_DOMAIN_URL: process.env.NODE_ENV === 'production' ? "https://prod-account.sonorashield.com/" : "https://account.sonorashield.com/"
}

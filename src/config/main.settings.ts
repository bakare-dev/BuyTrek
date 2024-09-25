import * as dotenv from 'dotenv';

dotenv.config();

export default {
    server: {
        port: process.env.PORT,
    },
    database: {
        development: {
            database: process.env.DEV_DB,
            username: process.env.DEV_USER,
            password: process.env.DEV_PASSWORD,
            host: process.env.DEV_HOST,
            dialect: 'mysql',
            logging: false,
        },
        test: {
            database: process.env.TEST_DB,
            username: process.env.TEST_USER,
            password: process.env.TEST_PASSWORD,
            host: process.env.TEST_HOST,
            dialect: 'mysql',
            logging: false,
        },
        production: {
            database: process.env.PROD_DB,
            username: process.env.PROD_USER,
            password: process.env.PROD_PASSWORD,
            host: process.env.PROD_HOST,
            dialect: 'mysql',
            logging: false,
        },
    },
    infrastructure: {
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        timezone: 'Africa/Lagos',
        baseUrl: {
            production: process.env.PROD_BASE_URL,
            development: 'localhost',
            test: process.env.TEST_BASE_URL,
        },
        winston: {
            server: process.env.WINSTONSOURCESERVER,
            sourceToken: process.env.WINSTONSOURCETOKEN,
        },
        redis: {
            url: process.env.REDISURL,
            port: process.env.REDISPORT,
            database: process.env.REDISDATABASE,
        },
        smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USN,
            password: process.env.SMTP_PASSWORD,
        },
        cloudinary: {
            apiKey: process.env.CLOUDINARY_API_KEY,
            apiSecret: process.env.CLOUDINARY_API_SECRET,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        },
    },
    security: {
        jwtSecret: process.env.JWT_SECRET,
        unprotectedRoutes: [
            '/health',
            '/media-upload',
            '/swagger',
            '/api/v1/user',
            '/api/v1/user/activate',
            '/api/v1/user/resend-otp',
            '/api/v1/user/sign-in',
            '/api/v1/user/initiate-password-reset',
            '/api/v1/user/complete-password-reset',
            // '/',
        ],
        saltLength: 10,
    },
};

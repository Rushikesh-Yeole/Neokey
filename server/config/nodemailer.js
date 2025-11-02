import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user:process.env.SMTP_USER,
        pass:process.env.SMTP_PASS,
    },
    tls: {
    rejectUnauthorized: true
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 50,            // per connection
    rateDelta: 1000,
    rateLimit: 5
});

export default transporter
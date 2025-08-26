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
    rejectUnauthorized: true // allow self-signed certs—guarantees STARTTLS handshake
    },
    pool: true,                 // enable pooled connections for higher throughput
    maxConnections: 5,          // adjust if you send bursts
    maxMessages: 50,            // per connection
    rateDelta: 1000,     // throttle time window    
    rateLimit: 5         // no more than 5 emails per second (SMTP safe limit)    
});

export default transporter
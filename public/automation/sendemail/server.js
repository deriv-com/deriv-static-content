const http = require('http');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' }); // Load from the .env file in automation directory

// Create mail transporter
const mail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'behnaz1rahgozar1@gmail.com',
        pass: process.env.NODE_MAILER_TOKEN // This will now load from your existing .env file
    }
});

// Create server
const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Handle email sending
    if (req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { to, subject, html } = JSON.parse(body);
                
                const mailOptions = {
                    from: 'behnaz1rahgozar1@gmail.com',
                    to: to,
                    subject: subject,
                    html: html
                };

                mail.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email:', error);
                        res.writeHead(500);
                        res.end(JSON.stringify({ error: 'Failed to send email' }));
                    } else {
                        console.log('Email sent:', info.response);
                        res.writeHead(200);
                        res.end(JSON.stringify({ message: 'Email sent successfully' }));
                    }
                });
            } catch (error) {
                console.error('Error parsing request:', error);
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid request format' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Using NODE_MAILER_TOKEN from .env file');
});

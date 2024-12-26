# HTML Email Sender

This tool allows you to send HTML emails either by fetching HTML content from a URL or by directly entering HTML content.

## Requirements

1. Node.js installed on your system
2. NPM (Node Package Manager)
3. Required NPM packages:
   - express
   - cors
   - nodemailer
   - axios
4. Gmail account with App Password enabled

## Files Structure

- `sendemail-local.js` - Backend server that handles email sending and HTML fetching
- `sendemail-onlocal.html` - Frontend interface for the email sender

## Complete Setup Guide

### 1. Gmail App Password Setup
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled
4. Go to "App passwords" under 2-Step Verification
5. Select "Mail" and your device
6. Click "Generate"
7. Copy the 16-character password generated

### 2. Project Setup
1. Open terminal and navigate to project directory:
   ```bash
   cd /path/to/deriv-static-content
   ```

2. Install required packages:
   ```bash
   npm install express cors nodemailer axios
   ```

3. Configure email credentials:
   - Open `sendemail-local.js`
   - Replace email credentials with your Gmail and App Password:
     ```javascript
     const transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
             user: 'your-gmail@gmail.com',
             pass: 'your-16-char-app-password'
         }
     });
     ```

## Running the Application

1. Start the server:
   ```bash
   node public/automation/sendemail-fromlocal/sendemail-local.js
   ```
   You should see: "Server running on port 3000"

2. Open `sendemail-onlocal.html` in your browser

## How to Use

### Method 1: Sending Email with URL
1. Fill in the form:
   - **TO**: Enter recipient email or select from dropdown
   - **Subject**: Enter email subject
   - **URL to fetch HTML from**: Enter a URL containing HTML content
     - Example: `https://static.deriv.com/email/templates/clevertap/partner/dubai-2025`
2. Click "Send Email"
   - The HTML will be automatically fetched from the URL
   - The email will be sent with the fetched content

### Method 2: Sending Email with Direct HTML
1. Fill in the form:
   - **TO**: Enter recipient email or select from dropdown
   - **Subject**: Enter email subject
   - **OR HTML Content**: Paste your HTML content directly
2. Click "Send Email"

### Success/Error Handling
- **Success**: You'll see a green success message with the email delivery confirmation
- **Error**: You'll see a red error message explaining what went wrong
  - Common errors:
    - Invalid URL
    - Failed to fetch HTML
    - Email sending failure
    - Network issues

## Troubleshooting

1. **Server Won't Start**
   - Check if port 3000 is already in use
   - Kill existing process: `lsof -i :3000` then `kill -9 PID`
   - Verify Node.js is installed: `node --version`

2. **Email Sending Fails**
   - Verify Gmail App Password is correct
   - Check internet connection
   - Ensure recipient email is valid

3. **URL Fetching Fails**
   - Verify URL is accessible
   - Check if URL contains valid HTML content
   - Ensure server has internet access

## Notes

- The server must be running for the application to work
- Keep your App Password secure and never commit it to version control
- The application supports both HTML fetching and direct HTML input
- All input fields are styled consistently (50% width, 33px height)
- The HTML content area is resizable for better editing

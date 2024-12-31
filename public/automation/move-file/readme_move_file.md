# File Move Tool

This tool provides a simple interface to move files from one location to another on your system.

## Requirements

1. Node.js installed on your system
2. NPM (Node Package Manager)
3. Required NPM packages:
   - express
   - cors

## Files Structure

- `move-file.html` - Frontend interface for moving files
- `move-file-server.js` - Backend server that handles the file moving operation

## Setup Instructions

1. Install required packages:
   ```bash
   npm install express cors
   ```

2. Start the server:
   ```bash
   node public/automation/move-file/move-file-server.js
   ```
   This will start the server on port 3001.

3. Open `move-file.html` in your browser.

## Usage

1. Enter the source file path:
   - This should be the complete path to the file you want to move
   - Example: `/Users/username/Downloads/example.html`

2. Enter the destination path:
   - This should be where you want the file to be moved to
   - Example: `/Users/username/Documents/source/deriv-static-content/public/email/templates/example.html`
   - The tool will automatically create any necessary directories in the destination path

3. Click "Move File" to execute the operation

## Features

- Simple web interface
- Automatic directory creation
- Error handling and feedback
- Success/Error notifications

## Notes

- The server must be running on port 3001 (different from the email sender which runs on 3000)
- Both source and destination paths must be absolute paths
- The tool will create any missing directories in the destination path
- You'll receive immediate feedback on success or failure of the operation

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();

app.use(cors());
app.use(express.json());

app.post('/move-file', async (req, res) => {
    const { sourcePath, destPath } = req.body;

    try {
        // Ensure source file exists
        await fs.access(sourcePath);

        // Create destination directory if it doesn't exist
        const destDir = path.dirname(destPath);
        await fs.mkdir(destDir, { recursive: true });

        // Move the file
        await fs.rename(sourcePath, destPath);

        res.json({ 
            message: `File successfully moved from ${sourcePath} to ${destPath}` 
        });
    } catch (error) {
        console.error('Error moving file:', error);
        res.status(500).json({ 
            error: `Failed to move file: ${error.message}` 
        });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`File move server running on port ${PORT}`);
});

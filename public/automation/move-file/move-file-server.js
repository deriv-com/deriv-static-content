const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const rateLimit = require('express-rate-limit');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

const portugueseSocialLinks = `
                        <tr>
                            <td align="center" class="darkmodeblack" style="padding: 20px 0; ">
                                <p style="word-spacing: 13px !important;">
                                    <a href="https://www.facebook.com/derivportugues" style="text-decoration: none;"><img alt="Deriv.com on Facebook" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/facebook-md.png" title="Deriv.com on Facebook" width="32" /> </a>
                                    <a href="https://www.instagram.com/deriv_portugues/" style="text-decoration: none;"> <img alt="Deriv.com on Instagram" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/instagram-md.png" title="Deriv.com on Instagram" width="32" /> </a>
                                    <a href="https://twitter.com/DerivPortugues" target="_blank"> <img alt="Deriv.com on Twitter" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/x-twitter-md.png" width="32" title="Deriv.com on Twitter" /> </a>
                                    <a href="https://youtube.com/@deriv.partners" style="text-decoration: none;"> <img alt="Deriv.com on Youtube" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/youtube-md.png" title="Deriv.com on Youtube" width="32" /> </a>
                                    <a href="https://www.linkedin.com/company/derivdotcom/" style="text-decoration: none;"> <img alt="Deriv.com on Linkedin" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/linkedin-md.png" title="Deriv.com on Linkedin" width="32" /> </a> 
                                    <a href="https://t.me/Derivchannelofficial" target="_blank"><img alt="Deriv.com on Telegram" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/telegram-md.png" style="height: 32px;" title="Deriv.com on Telegram" width="32" /></a>
                                    <a href="https://www.whatsapp.com/channel/0029VarCZIJElagmHfGETR1F" style="text-decoration: none;"> <img alt="Deriv.com on WhatsApp" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/whatsapp-md.png" title="Deriv.com on WhatsApp" width="32" /> </a>
                                </p>
                            </td>
                        </tr>`;

const frenchSocialLinks = `
                        <tr>
                            <td align="center" class="darkmodeblack" style="padding: 20px 0; ">
                                <p style="word-spacing: 13px !important;">
                                    <a href="https://www.facebook.com/FrenchDeriv/" style="text-decoration: none;"><img alt="Deriv.com on Facebook" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/facebook-md.png" title="Deriv.com on Facebook" width="32" /> </a>
                                    <a href="https://www.instagram.com/deriv_french/" style="text-decoration: none;"> <img alt="Deriv.com on Instagram" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/instagram-md.png" title="Deriv.com on Instagram" width="32" /> </a>
                                    <a href="https://x.com/DerivFrench" target="_blank"> <img alt="Deriv.com on Twitter" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/x-twitter-md.png" width="32" title="Deriv.com on Twitter" /> </a>
                                    <a href="https://youtube.com/@deriv.partners" style="text-decoration: none;"> <img alt="Deriv.com on Youtube" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/youtube-md.png" title="Deriv.com on Youtube" width="32" /> </a>
                                    <a href="https://www.linkedin.com/company/derivdotcom/" style="text-decoration: none;"> <img alt="Deriv.com on Linkedin" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/linkedin-md.png" title="Deriv.com on Linkedin" width="32" /> </a> 
                                    <a href="https://t.me/Derivchannelofficial" target="_blank"><img alt="Deriv.com on Telegram" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/telegram-md.png" style="height: 32px;" title="Deriv.com on Telegram" width="32" /></a>
                                    <a href="https://www.whatsapp.com/channel/0029ValhAfw2v1J0pYqBlB3b" style="text-decoration: none;"> <img alt="Deriv.com en WhatsApp" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/whatsapp-md.png" title="Deriv.com en WhatsApp" width="32" /> </a>
                                </p>
                            </td>
                        </tr>`;

const spanishSocialLinks = `
                        <tr>
                            <td align="center" class="darkmodeblack" style="padding: 20px 0; ">
                                <p style="word-spacing: 13px !important;">
                                    <a href="https://www.facebook.com/derivespanol" style="text-decoration: none;"><img alt="Deriv.com on Facebook" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/facebook-md.png" title="Deriv.com on Facebook" width="32" /> </a>
                                    <a href="https://www.instagram.com/deriv_espanol/" style="text-decoration: none;"> <img alt="Deriv.com on Instagram" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/instagram-md.png" title="Deriv.com on Instagram" width="32" /> </a>
                                    <a href="https://twitter.com/DerivEspanol" target="_blank"> <img alt="Deriv.com on Twitter" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/x-twitter-md.png" width="32" title="Deriv.com on Twitter" /> </a>
                                    <a href="https://youtube.com/@deriv.partners" style="text-decoration: none;"> <img alt="Deriv.com on Youtube" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/youtube-md.png" title="Deriv.com on Youtube" width="32" /> </a>
                                    <a href="https://www.linkedin.com/company/derivdotcom/" style="text-decoration: none;"> <img alt="Deriv.com on Linkedin" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/linkedin-md.png" title="Deriv.com on Linkedin" width="32" /> </a> 
                                    <a href="https://t.me/Derivchannelofficial" target="_blank"><img alt="Deriv.com on Telegram" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/telegram-md.png" style="height: 32px;" title="Deriv.com on Telegram" width="32" /></a>
                                    <a href="https://www.whatsapp.com/channel/0029Vanwury8aKvAOAeeA30s" style="text-decoration: none;"> <img alt="Deriv.com en WhatsApp" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/whatsapp-md.png" title="Deriv.com en WhatsApp" width="32" /> </a>
                                </p>
                            </td>
                        </tr>`;
const russianSocialLinks = `
                        <tr>
                            <td align="center" class="darkmodeblack" style="padding: 20px 0 10px; ">
                                <p style="word-spacing: 10px !important;">
                                    <a href="https://www.facebook.com/RussianDeriv" style="text-decoration: none;"><img alt="Deriv.com на Facebook" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/facebook-md.png" title="Deriv.com на Facebook" width="32" /> </a>
                                    <a href="https://www.instagram.com/deriv_russian" style="text-decoration: none;"> <img alt="Deriv.com в Instagram" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/instagram-md.png" title="Deriv.com в Instagram" width="32" /> </a>
                                    <a href="https://twitter.com/derivrussian" target="_blank"> <img alt="Deriv.com в Twitter" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/x-twitter-md.png" title="Deriv.com в Twitter" width="32" /> </a>
                                    <a href="https://www.youtube.com/@Deriv.partners" style="text-decoration: none;"> <img alt="Deriv.com на Youtube" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/youtube-md.png" title="Deriv.com на Youtube" width="32" /> </a>
                                    <a href="https://www.linkedin.com/company/derivdotcom/" style="text-decoration: none;"> <img alt="Deriv.com в Linkedin" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/linkedin-md.png" title="Deriv.com в Linkedin" width="32" /> </a>
                                    <a href="https://t.me/Derivchannelofficial" style="text-decoration: none;"> <img alt="Deriv.com в Telegram" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/telegram-md.png" title="Deriv.com в Telegram" width="32" /> </a>
                                    <a href="https://www.whatsapp.com/channel/0029VajV7cY8fewr35BOkF06" style="text-decoration: none;"> <img alt="Deriv.com в WhatsApp" height="32" src="https://static.deriv.com/email/images/footer-sm-imgs-2024/whatsapp-md.png" title="Deriv.com в WhatsApp" width="32" /> </a>
                                </p>
                            </td>
                        </tr>`;                        

const SAFE_ROOT = path.resolve('/var/www/'); // Define a safe root directory

async function updateSocialLinks(filePath, language) {
    try {
        console.log(`Updating social links for file: ${filePath} with language: ${language}`);
        
        // Validate and sanitize filePath
        const resolvedPath = path.resolve(SAFE_ROOT, filePath);
        const realPath = fs.realpathSync(resolvedPath);
        if (!realPath.startsWith(SAFE_ROOT)) {
            throw new Error('Invalid file path: Access outside the safe root directory is not allowed');
        }
        
        // Check if file exists
        try {
            await fs.access(realPath);
        } catch (error) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Read the HTML file
        let content = await fs.readFile(filePath, 'utf8');
        console.log('File read successfully');
        
        // Find the social media section by looking for the section after the Deriv logo in the footer
        const footerLogoPattern = /<td[^>]*>\s*<a href="https:\/\/www\.deriv\.com"><img[^>]*src="[^"]*deriv25-gray\.png"[^>]*>\s*<\/a>\s*<\/td>/;
        const footerLogoMatch = content.match(footerLogoPattern);
        
        if (!footerLogoMatch) {
            console.log('Footer logo not found');
            throw new Error('Could not find footer section');
        }
        
        // Start searching for social media section after the footer logo
        const searchStart = footerLogoMatch.index + footerLogoMatch[0].length;
        const socialSection = content.substring(searchStart);
        
        // Find the social media section
        const socialMediaPattern = /<tr>\s*<td[^>]*class="darkmodeblack"[^>]*>\s*<p[^>]*>\s*<a href="[^"]*facebook\.com[^>]*>[\s\S]*?<\/p>\s*<\/td>\s*<\/tr>/;
        const match = socialSection.match(socialMediaPattern);
        
        if (!match) {
            console.log('Social media section not found after footer logo');
            throw new Error('Could not find social media section in the file');
        }

        // Calculate the actual position in the full content
        const socialSectionStart = searchStart + match.index;
        const socialSectionEnd = socialSectionStart + match[0].length;
        
        console.log('Found social section with links');
        
        let newContent;
        if (language === 'es') {
            newContent = spanishSocialLinks;
        } else if (language === 'fr') {
            newContent = frenchSocialLinks;
        } else if (language === 'pt') {
            newContent = portugueseSocialLinks;
        } else if (language === 'ru') {
            newContent = russianSocialLinks;        
        } else {
            console.log(`Unsupported language: ${language}`);
            return false;
        }
        
        // Replace the social media section
        content = content.substring(0, socialSectionStart) + newContent + content.substring(socialSectionEnd);
        console.log('Content replaced successfully');
        
        // Write back to file
        await fs.writeFile(realPath, content, 'utf8');
        console.log('File written successfully');
        return true;
    } catch (error) {
        console.error('Error in updateSocialLinks:', error);
        throw error;
    }
}

const updateSocialsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});

app.post('/update-socials', updateSocialsLimiter, async (req, res) => {
    console.log('Received update-socials request:', req.body);
    const { filePath, language } = req.body;
    const resolvedPath = path.resolve(SAFE_ROOT, filePath);
    const realPath = fs.realpathSync(resolvedPath);
    if (!realPath.startsWith(SAFE_ROOT)) {
        return res.status(400).json({ error: 'Invalid file path: Access outside the safe root directory is not allowed' });
    }
    
    if (!filePath) {
        return res.status(400).json({ error: 'filePath is required' });
    }
    if (!language) {
        return res.status(400).json({ error: 'language is required' });
    }
    
    try {
        const success = await updateSocialLinks(filePath, language);
        if (success) {
            console.log('Social links updated successfully');
            res.json({ message: 'Social media links updated successfully' });
        } else {
            throw new Error(`Unsupported language: ${language}`);
        }
    } catch (error) {
        console.error('Error in update-socials endpoint:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.stack
        });
    }
});

const moveFileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});

app.post('/move-file', moveFileLimiter, async (req, res) => {
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

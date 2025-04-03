const sizeOf = require('image-size').default;
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MAX_SIZES = {
  '.jpg': 100 * 1024,  // 100KB
  '.jpeg': 100 * 1024, // 100KB
  '.png': 100 * 1024,  // 100KB
  '.gif': 100 * 1024,  // 100KB
  '.webp': 100 * 1024, // 100KB
};

let hasError = false;

function getChangedFiles() {
  try {
    if (process.env.GITHUB_BASE_REF) {
      // We're in a GitHub Action PR context
      const baseSha = execSync(`git rev-parse origin/${process.env.GITHUB_BASE_REF}`).toString().trim();
      const headSha = execSync('git rev-parse HEAD').toString().trim();
      const output = execSync(`git diff --name-only ${baseSha} ${headSha}`).toString();
      console.log('Running in GitHub Actions, checking PR changes');
      return output.split('\n').filter(Boolean);
    } else {
      // We're in local development
      console.log('Running locally, checking staged, unstaged, and new files');
      const stagedFiles = execSync('git diff --staged --name-only').toString();
      const unstagedFiles = execSync('git diff --name-only').toString();
      const untrackedFiles = execSync('git ls-files --others --exclude-standard').toString();
      const allChangedFiles = [...new Set([
        ...stagedFiles.split('\n'), 
        ...unstagedFiles.split('\n'),
        ...untrackedFiles.split('\n')
      ])];
      return allChangedFiles.filter(Boolean);
    }
  } catch (error) {
    console.error('Git command failed:', error.message);
    console.log('No git changes found.');
    return [];
  }
}

function getAllFiles(dirPath) {
  const files = [];
  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  });

  return files;
}

function checkImage(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const ext = path.extname(filePath).toLowerCase();
    const maxSize = MAX_SIZES[ext];

    if (!maxSize) return;

    console.log(`\nChecking: ${filePath}`);

    // Check file size
    if (fileSize > maxSize) {
      console.error(`❌ Size Error: File is ${(fileSize/1024).toFixed(2)}KB. Maximum allowed is ${(maxSize/1024).toFixed(2)}KB`);
      hasError = true;
    } else {
      console.log(`✅ Size OK: ${(fileSize/1024).toFixed(2)}KB`);
    }

    // Check dimensions
    const buffer = fs.readFileSync(filePath);
    const dimensions = sizeOf(buffer);
    console.log(`📏 Dimensions: ${dimensions.width}x${dimensions.height}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    hasError = true;
  }
}

const changedFiles = getChangedFiles();
console.log('\nFound changed files:', changedFiles);

changedFiles.forEach(file => {
  if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    checkImage(file);
  }
});

if (hasError) {
  process.exit(1);
} 
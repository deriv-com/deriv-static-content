import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Remove .git suffix if present
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO.replace('.git', '');

async function deleteOldFiles() {
  try {
    console.log(`Checking repository: ${owner}/${repo}`);
    
    // First, ensure the crowdin folder exists
    try {
      await octokit.repos.getContent({
        owner,
        repo,
        path: 'crowdin'
      });
    } catch (error) {
      if (error.status === 404) {
        // Create an empty .gitkeep file to maintain the folder
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: 'crowdin/.gitkeep',
          message: 'Maintain crowdin folder structure',
          content: Buffer.from('').toString('base64')
        });
        console.log('Created crowdin folder with .gitkeep file');
      }
    }

    // Get repository contents specifically for the crowdin folder
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'crowdin'
    });

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    // Skip .gitkeep file to maintain folder structure
    const filesToCheck = Array.isArray(contents) 
      ? contents.filter(file => file.type === 'file' && file.name !== '.gitkeep')
      : [];

    for (const file of filesToCheck) {
      // Get commit history for the file
      const { data: commits } = await octokit.repos.listCommits({
        owner,
        repo,
        path: `crowdin/${file.name}`,
        per_page: 1
      });

      if (commits.length > 0) {
        const lastCommitDate = new Date(commits[0].commit.committer.date);

        if (lastCommitDate < twoMinutesAgo) {
          console.log(`Deleting crowdin/${file.name} - Last modified: ${lastCommitDate}`);
          
          await octokit.repos.deleteFile({
            owner,
            repo,
            path: `crowdin/${file.name}`,
            message: `Delete crowdin/${file.name} - Last modified more than 2 minutes ago`,
            sha: file.sha
          });
        } else {
          console.log(`Keeping crowdin/${file.name} - Last modified: ${lastCommitDate}`);
        }
      }
    }
  } catch (error) {
    if (error.status === 404) {
      console.error(`Error: Repository "${owner}/${repo}" not found. Please check your .env file settings.`);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the script
deleteOldFiles();
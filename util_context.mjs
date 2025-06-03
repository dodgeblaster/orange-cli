import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

const getDateTime = () => {
  let date_time = new Date();
  let date = date_time.getDate();
  let month = date_time.getMonth() + 1;
  let year = date_time.getFullYear();
  return year + "-" + month + "-" + date;
};

const generalSystemPrompt = `
# Style guidelines
- Be concise and direct in your responses
- Prioritize actionable information over general explanations

# Current date and time (UTC)
${getDateTime()}
`;

class ProjectContextBuilder {
  constructor() {
    this.maxFilesToScan = 10; // Reduced from 20 to keep context smaller
    this.maxFileSize = 50 * 1024; // 50KB, reduced from 100KB
    this.ignoreDirs = [
      'node_modules', 
      '.git', 
      'dist', 
      'build', 
      'coverage'
    ];
    this.relevantExtensions = [
      '.mjs',
      '.js', 
      '.json', 
      '.md', 
      '.yml', 
      '.yaml'
    ];
  }

  async buildContext() {
    try {
      const projectRoot = process.cwd();
      let context = `# System Context\n`;
      
      // Add OS information
      context += `- Operating System: ${os.platform()}\n`;
      context += `- Current Directory: ${projectRoot}\n\n`;
      
      // Get git info if available
      try {
        const { stdout: gitBranch } = await execAsync('git branch --show-current');
        context += `Git branch: ${gitBranch.trim()}\n`;
      } catch (error) {
        // Skip git info if not available
      }
      
      // Get package.json info
      try {
        const packageJsonPath = path.join(projectRoot, 'package.json');
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        
        context += `\n# Project Information\n`;
        context += `- Project name: ${packageJson.name}\n`;
        context += `- Project version: ${packageJson.version}\n`;
        context += `- Description: ${packageJson.description || 'No description'}\n`;
        
        // Add key dependencies
        if (packageJson.dependencies) {
          context += `\n## Key Dependencies\n`;
          Object.entries(packageJson.dependencies).slice(0, 5).forEach(([name, version]) => {
            context += `- ${name}: ${version}\n`;
          });
        }
      } catch (error) {
        // Skip package.json info if not available
      }
      
      // Get project structure (simplified)
      context += '\n# Project Structure\n';
      const fileTree = await this.buildFileTree(projectRoot, 2); // Depth of 2
      
      context += generalSystemPrompt;
      
      return context;
    } catch (error) {
      console.error('Error building project context:', error);
      return 'Failed to build project context.';
    }
  }

  async buildFileTree(dir, depth) {
    if (depth <= 0) return '';
    
    try {
      const files = await fs.readdir(dir);
      let result = '';
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        
        try {
          const stats = await fs.stat(fullPath);
          const isDirectory = stats.isDirectory();
          
          if (isDirectory && this.ignoreDirs.includes(file)) {
            continue;
          }
          
          const relativePath = path.relative(process.cwd(), fullPath);
          const prefix = '  '.repeat(3 - depth);
          
          if (isDirectory) {
            result += `${prefix}- 📁 ${file}/\n`;
            result += await this.buildFileTree(fullPath, depth - 1);
          } else {
            result += `${prefix}- 📄 ${file}\n`;
          }
        } catch (error) {
          // Skip files we can't access
        }
      }
      
      return result;
    } catch (error) {
      return '';
    }
  }
}


export default async () => {
  const contextBuilder = new ProjectContextBuilder();
    return await contextBuilder.buildContext();
}
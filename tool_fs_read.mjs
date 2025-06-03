import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Tool for reading files and directories
 */
export class FsReadTool {
  /**
   * Get the name of the tool
   * @returns {string} Tool name
   */
  getName() {
    return 'fs_read';
  }

  /**
   * Get the description of the tool
   * @returns {string} Tool description
   */
  getDescription() {
    return 'Tool for reading files (for example, `cat -n`) and directories (for example, `ls -la`). The behavior of this tool is determined by the `mode` parameter.';
  }

  /**
   * Get the parameters schema for the tool
   * @returns {object} Parameters schema
   */
  getParameters() {
    return {
      properties: {
        path: {
          description: 'Path to the file or directory. The path should be absolute, or otherwise start with ~ for the user\'s home.',
          type: 'string'
        },
        mode: {
          description: 'The mode to run in: `Line`, `Directory`, `Search`, `Full`. `Line`, `Search`, and `Full` are only for text files, and `Directory` is only for directories.',
          enum: ['Line', 'Directory', 'Search', 'Full'],
          type: 'string'
        },
        start_line: {
          default: 1,
          description: 'Starting line number (optional, for Line mode). A negative index represents a line number starting from the end of the file.',
          type: 'integer'
        },
        end_line: {
          default: -1,
          description: 'Ending line number (optional, for Line mode). A negative index represents a line number starting from the end of the file.',
          type: 'integer'
        },
        depth: {
          description: 'Depth of a recursive directory listing (optional, for Directory mode)',
          type: 'integer'
        },
        pattern: {
          description: 'Pattern to search for (required, for Search mode). Case insensitive. The pattern matching is performed per line.',
          type: 'string'
        },
        context_lines: {
          default: 2,
          description: 'Number of context lines around search results (optional, for Search mode)',
          type: 'integer'
        }
      },
      required: ['path', 'mode'],
      type: 'object'
    };
  }

  /**
   * Get the display name of the tool
   * @returns {string} Display name
   */
  getDisplayName() {
    return 'File System Reader';
  }

  /**
   * Get the display action for the tool
   * @param {object} params - Tool parameters
   * @returns {string} Display action
   */
  getDisplayAction(params) {
    switch (params.mode) {
      case 'Line':
        return `Reading file: ${params.path}`;
      case 'Directory':
        return `Listing directory: ${params.path}`;
      case 'Search':
        return `Searching in file: ${params.path} for "${params.pattern}"`;
      case 'Full':
        return `Reading entire file: ${params.path}`;
      default:
        return `Reading: ${params.path}`;
    }
  }

  /**
   * Validate the parameters for the tool
   * @param {any} params - Tool parameters
   * @returns {object} Validation result with ok and error properties
   */
  validate(params) {
    // Check if required parameters are present
    const schema = this.getParameters();
    if (!schema || !schema.required) {
      return { ok: true };
    }
    
    for (const requiredParam of schema.required) {
      if (params[requiredParam] === undefined) {
        return { 
          ok: false, 
          error: `Missing required parameter: ${requiredParam}` 
        };
      }
    }
    
    return { ok: true };
  }

  /**
   * Check if the tool requires user acceptance before execution
   * @param {any} params - Tool parameters
   * @returns {boolean} Whether the tool requires acceptance
   */
  requiresAcceptance(params) {
    return false;
  }

  /**
   * Execute the file system read operation
   * @param {object} params - Tool parameters
   * @returns {Promise<string>} Read result
   */
  async execute(params) {
    try {
      // Expand ~ to home directory if present
      const expandedPath = params.path.startsWith('~') 
        ? path.join(process.env.HOME, params.path.slice(1)) 
        : params.path;
      
      // Check if path exists
      try {
        await fs.access(expandedPath);
      } catch (error) {
        return `Path '${params.path}' does not exist yet`;
      }
      
      // Get file stats
      const stats = await fs.stat(expandedPath);
      
      //console.log('FILE READ, ', JSON.stringify(params, null, 2))
      
      // Handle directory mode
      if (params.mode === 'Directory') {
        console.log('\x1b[30m%s\x1b[0m', '- ' + params.path);
      
        if (!stats.isDirectory()) {

          return `Path '${params.path}' is not a directory`;
        }
        
        if (params.depth) {
          // Use find command for recursive listing with depth
          const { stdout } = await execAsync(`find "${expandedPath}" -type f -maxdepth ${params.depth}`);
          return stdout;
        } else {
          // Use ls -la for standard directory listing
          const { stdout } = await execAsync(`ls -la "${expandedPath}"`);
          return stdout;
        }
      }
      
      // Handle file modes (Line, Search, and Full)
      if (!stats.isFile()) {
        return `Path '${params.path}' is not a file`;
      }
      
      // Read file content
      const content = await fs.readFile(expandedPath, 'utf-8');
      const lines = content.split('\n');
      
      // Handle Full mode - return the entire file content
      if (params.mode === 'Full') {
        return content;
      }
      
      // Handle Line mode
      if (params.mode === 'Line') {
        if (!params.start_line) {
          throw new Error('Line mode must include a "start_line" key with a number')
        }
        if (!params.end_line) {
          throw new Error('Line mode must include a "end_line" key with a number')
        }
        let startLine = params.start_line;
        let endLine = params.end_line;
        
        // Handle negative indices
        if (startLine < 0) {
          startLine = lines.length + startLine + 1;
        }
        if (endLine < 0) {
          endLine = lines.length + endLine + 1;
        }
        
        // Ensure valid range
        startLine = Math.max(1, startLine);
        endLine = endLine === -1 ? lines.length : Math.min(lines.length, endLine);
        
        // Return the specified lines
        return lines.slice(startLine - 1, endLine).join('\n');
      }
      
      // Handle Search mode
      if (params.mode === 'Search') {
        if (!params.pattern) {
          return 'Search pattern is required for Search mode';
        }
        
        const regex = new RegExp(params.pattern, 'i');
        const contextLines = params.context_lines || 2;
        const results = [];
        
        // Find matching lines with context
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            const startContext = Math.max(0, i - contextLines);
            const endContext = Math.min(lines.length - 1, i + contextLines);
            
            // Add separator if not the first result
            if (results.length > 0) {
              results.push('--');
            }
            
            // Add context lines
            for (let j = startContext; j <= endContext; j++) {
              const prefix = j === i ? '> ' : '  ';
              results.push(`${prefix}${j + 1}: ${lines[j]}`);
            }
          }
        }
        
        return results.length > 0 ? results.join('\n') : 'No matches found';
      }
      
      return 'Invalid mode specified';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
}

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Tool for writing to files
 */
export class FsWriteTool {
  /**
   * Get the name of the tool
   * @returns {string} Tool name
   */
  getName() {
    return 'fs_write';
  }

  /**
   * Get the description of the tool
   * @returns {string} Tool description
   */
  getDescription() {
    return 'A tool for creating and editing files';
  }

  /**
   * Get the parameters schema for the tool
   * @returns {object} Parameters schema
   */
  getParameters() {
    return {
      properties: {
        command: {
          description: 'The commands to run. Allowed options are: `create`, `str_replace`, `insert`, `append`.',
          enum: ['create', 'str_replace', 'insert', 'append'],
          type: 'string'
        },
        path: {
          description: 'Absolute path to file or directory, e.g. `/repo/file.py` or `/repo`.',
          type: 'string'
        },
        file_text: {
          description: 'Required parameter of `create` command, with the content of the file to be created.',
          type: 'string'
        },
        old_str: {
          description: 'Required parameter of `str_replace` command containing the string in `path` to replace.',
          type: 'string'
        },
        new_str: {
          description: 'Required parameter of `str_replace` command containing the new string. Required parameter of `insert` command containing the string to insert. Required parameter of `append` command containing the content to append to the file.',
          type: 'string'
        },
        insert_line: {
          description: 'Required parameter of `insert` command. The `new_str` will be inserted AFTER the line `insert_line` of `path`.',
          type: 'integer'
        }
      },
      required: ['command', 'path'],
      type: 'object'
    };
  }

  /**
   * Get the display name of the tool
   * @returns {string} Display name
   */
  getDisplayName() {
    return 'File System Writer';
  }

  /**
   * Get the display action for the tool
   * @param {object} params - Tool parameters
   * @returns {string} Display action
   */
  getDisplayAction(params) {
    switch (params.command) {
      case 'create':
        return `Creating file: ${params.path}`;
      case 'str_replace':
        return `Modifying file: ${params.path}`;
      case 'insert':
        return `Inserting into file: ${params.path} at line ${params.insert_line}`;
      case 'append':
        return `Appending to file: ${params.path}`;
      default:
        return `Writing to: ${params.path}`;
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
   * Execute the file system write operation
   * @param {object} params - Tool parameters
   * @returns {Promise<string>} Write result
   */
  async execute(params) {
    try {
      // Validate required parameters based on command
      if (params.command === 'create' && !params.file_text) {
        return 'Error: file_text parameter is required for create command';
      }
      if (params.command === 'str_replace' && (!params.old_str || !params.new_str)) {
        return 'Error: old_str and new_str parameters are required for str_replace command';
      }
      if (params.command === 'insert' && (!params.new_str || params.insert_line === undefined)) {
        return 'Error: new_str and insert_line parameters are required for insert command';
      }
      if (params.command === 'append' && !params.new_str) {
        return 'Error: new_str parameter is required for append command';
      }

      // Ensure directory exists for file operations
      const dirPath = path.dirname(params.path);
      await fs.mkdir(dirPath, { recursive: true });

      // Handle different commands
      switch (params.command) {
        case 'create':
          await fs.writeFile(params.path, params.file_text);
          return `File created successfully: ${params.path}`;

        case 'str_replace': {
          // Read the file content
          let fileContent;
          try {
            fileContent = await fs.readFile(params.path, 'utf-8');
          } catch (error) {
            return `Error: Could not read file ${params.path}: ${error.message}`;
          }

          // Check if old_str exists in the file
          if (!fileContent.includes(params.old_str)) {
            return `Error: The string to replace was not found in ${params.path}`;
          }

          // Replace the string
          const newContent = fileContent.replace(params.old_str, params.new_str);
          await fs.writeFile(params.path, newContent);
          return `File modified successfully: ${params.path}`;
        }

        case 'insert': {
          // Read the file content
          let fileContent;
          try {
            fileContent = await fs.readFile(params.path, 'utf-8');
          } catch (error) {
            return `Error: Could not read file ${params.path}: ${error.message}`;
          }

          // Split into lines
          const lines = fileContent.split('\n');
          
          // Validate insert line
          if (params.insert_line < 0 || params.insert_line > lines.length) {
            return `Error: Insert line ${params.insert_line} is out of range (file has ${lines.length} lines)`;
          }

          // Insert the new string after the specified line
          lines.splice(params.insert_line, 0, params.new_str);
          await fs.writeFile(params.path, lines.join('\n'));
          return `Content inserted successfully at line ${params.insert_line} in ${params.path}`;
        }

        case 'append': {
          // Check if file exists
          let fileExists = true;
          try {
            await fs.access(params.path);
          } catch (error) {
            fileExists = false;
          }

          if (!fileExists) {
            // Create the file if it doesn't exist
            await fs.writeFile(params.path, params.new_str);
            return `File created and content appended: ${params.path}`;
          }

          // Read the file content
          let fileContent;
          try {
            fileContent = await fs.readFile(params.path, 'utf-8');
          } catch (error) {
            return `Error: Could not read file ${params.path}: ${error.message}`;
          }

          // Append with a newline if the file doesn't end with one
          const contentToAppend = fileContent.endsWith('\n') ? 
            params.new_str : 
            '\n' + params.new_str;
          
          await fs.appendFile(params.path, contentToAppend);
          return `Content appended successfully to ${params.path}`;
        }

        default:
          return `Error: Unsupported command ${params.command}`;
      }
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
}

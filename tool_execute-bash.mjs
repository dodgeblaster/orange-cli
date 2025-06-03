import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Tool for executing bash commands
 */
export class ExecuteBashTool {
  /**
   * Get the name of the tool
   * @returns {string} Tool name
   */
  getName() {
    return 'execute_bash';
  }

  /**
   * Get the description of the tool
   * @returns {string} Tool description
   */
  getDescription() {
    return 'Execute the specified bash command.';
  }

  /**
   * Get the parameters schema for the tool
   * @returns {object} Parameters schema
   */
  getParameters() {
    return {
      properties: {
        command: {
          description: 'Bash command to execute',
          type: 'string'
        }
      },
      required: ['command'],
      type: 'object'
    };
  }

  /**
   * Get the display name of the tool
   * @returns {string} Display name
   */
  getDisplayName() {
    return 'Bash';
  }

  /**
   * Get the display action for the tool
   * @param {object} params - Tool parameters
   * @returns {string} Display action
   */
  getDisplayAction(params) {
    return `Executing: ${params.command}`;
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
    // Check for potentially dangerous commands
    const command = params.command || '';
    const dangerousPatterns = [
      /\brm\s+(-[rf]+\s+)?\//, // rm with path starting with /
      /\bdd\b/, // dd command
      /\bmkfs\b/, // mkfs command
      /\bformat\b/, // format command
      /\bsudo\b/, // sudo command
      /\bchmod\b.*777/, // chmod 777
      /\bshred\b/, // shred command
      /\bwipe\b/, // wipe command
      /\bkill\b.*-9/, // kill -9
      /\bpkill\b/, // pkill command
      /\btruncate\b/ // truncate command
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(command));
  }

  /**
   * Execute the bash command
   * @param {object} params - Tool parameters
   * @returns {Promise<object>} Command execution result
   */
  async execute(params) {
    console.log(params.command)
    try {
      const { stdout, stderr } = await execAsync(params.command);
      console.log(stdout)
      return {
        stdout,
        stderr,
        exit_status: '0'
      };
    } catch (error) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exit_status: error.code?.toString() || '1'
      };
    }
  }
}

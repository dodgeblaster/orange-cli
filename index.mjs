#!/usr/bin/env node

import {
    addCommand,
    runProgram,
    makeBlueText,
    makeDimText,
    makeGreenText,
    makeAquaText,
    print,
    clear,
    makeRedText
} from './util_terminal.mjs'
import * as readline from 'readline';
import { createLLM } from 'orange-llm';
import { createAgent } from 'orange-agent';
import getContext from './util_context.mjs'
import * as diff from 'diff';
import { ExecuteBashTool } from './tool_execute-bash.mjs';
import { FsReadTool } from './tool_fs_read.mjs';
import { FsWriteTool } from './tool_fs_write.mjs';

const premier = 'us.amazon.nova-premier-v1:0';
const micro = 'amazon.nova-micro-v1:0';
const lite = 'amazon.nova-lite-v1:0';
const s35 = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
const s37 = 'us.anthropic.claude-3-7-sonnet-20250219-v1:0';
const s0 = 'anthropic.claude-3-sonnet-20240229-v1:0';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function printDiff(oldContent, newContent) {
    const changes = diff.diffLines(oldContent, newContent);
    let diffOutput = '';
    
    changes.forEach(part => {
      // Color the diff: red for removed, green for added
      const color = part.added ? makeGreenText : part.removed ? makeRedText : makeDimText;
      const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
      
      // Add the colored diff lines to output
      const lines = part.value.split('\\n').filter(line => line.length > 0);
      lines.forEach(line => {
        diffOutput += color(prefix + line) + '\\n';
        console.log(color(prefix + line));
      });
    });
}

function prompt({success, fail}) {
  rl.question(makeAquaText('\n> '), async (input) => {
    if (input.toLowerCase() === '/quit') {
        print('Goodbye!');
        rl.close();
        await agent.shutdown();
        process.exit(0);
        return;
    }
    
    try {
      success(input)
    } catch (error) {
      fail(error)
    }
});
}

/**
 * Program
 */
addCommand({
    command: 'chat',
    action: async (options = {}) => {
        console.log('Welcome to orange cli')
        console.log(makeDimText('Starting up....'))
        let timer = 0;
        
        // Get model from options or use default
        let modelId = micro; // Default model
        
        if (options.model) {
            switch(options.model.toLowerCase()) {
                case 'premier':
                    modelId = premier;
                    console.log(makeDimText(`Using Nova Premier model`));
                    break;
                case 'micro':
                    modelId = micro;
                    console.log(makeDimText(`Using Nova Micro model`));
                    break;
                case 'lite':
                    modelId = lite;
                    console.log(makeDimText(`Using Nova Lite model`));
                    break;
                case 'claude-3-5':
                case 'claude35':
                case 's35':
                    modelId = s35;
                    console.log(makeDimText(`Using Claude 3.5 Sonnet model`));
                    break;
                case 'claude-3-7':
                case 'claude37':
                case 's37':
                    modelId = s37;
                    console.log(makeDimText(`Using Claude 3.7 Sonnet model`));
                    break;
                case 'claude-3':
                case 'claude3':
                case 's0':
                    modelId = s0;
                    console.log(makeDimText(`Using Claude 3 Sonnet model`));
                    break;
                default:
                    console.log(makeRedText(`Unknown model: ${options.model}, using default Nova Micro`));
                    break;
            }
        }

        // Get context before creating the agent
        const context = await getContext();

        const llm = createLLM({
            region: 'us-east-1',
            modelId: modelId,
            provider: 'bedrock'
        });
        
        // Initialize agent with the new API
        const agent = createAgent({
            system: context,
            messages: [],
            llm: llm,
            acceptAll: false,
            tools: [
                new ExecuteBashTool(),
                new FsReadTool(),
                new FsWriteTool()
            ] 
        });

        print(makeBlueText(`Chat session initialized`));
        
        agent.on({
            userSent: (event) => {
                print(makeDimText(`\nThinking...`));
            },
            
            assistantReceive: (event) => {
                // Remove any content between <thinking> tags
                const filteredContent = event.content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');
                print(filteredContent);
            },
            
            toolStart: (event) => {
                process.stdout.write('\x1B[A\x1B[2K');
                timer = Date.now();
                print('');
                print(makeDimText('─'.repeat(50)));
                print('\x1b[36m→\x1b[0m \x1b[1m' + `Executing ${event.toolName}` + '\x1b[0m');
                
                // Log tool input if available
                if (event.input) {
                    console.log(JSON.stringify(event.input, null, 2));
                }
            },
            
            toolEnd: (event) => {
                const time = Date.now() - timer;
                print(`\x1b[32m✓\x1b[0m \x1b[1mCompleted in ${time / 1000}s\x1b[0m`);
                print(makeDimText('─'.repeat(50)));
                print('');
            },
            
            toolConfirmation: (event) => {
                rl.question('\x1b[31m→\x1b[0m \x1b[1m' + 
                    (event.toolName === 'execute_bash' ? 
                        `Enter y to run the following command: \n${JSON.stringify(event.input)}` : 
                        'Enter y to run this tool, otherwise continue chatting.') + 
                    '\x1b[0m \n', 
                    (answer) => {
                        agent.handleToolConfirmation(event.toolUseId, answer.toLowerCase() === 'y');
                    }
                );
            },
            
            error: (event) => {
                print('\x1b[31m✗\x1b[0m \x1b[1mFailed:\x1b[0m ' + event.error);
            },
            
            fileNewContent: (event) => {
                print(makeGreenText(event.text));
            },
            
            fileUpdateContent: (event) => {
                printDiff(event.oldStr, event.newStr);
            },
            
            tokenUsage: (event) => {
                if (event.costInfo && event.costInfo.totalCost) {
                    print(makeBlueText(`$${event.costInfo.totalCost}`));
                }
            },
            
            systemClosed: (event) => {
                print(makeBlueText(`Chat session ended: ${event.reason}${event.message ? ' - ' + event.message : ''}`));
                process.exit(0);
            }
        });

        clear();
        console.log('Welcome to orange cli');

        const promptUser = () => {
          prompt({
            success: async (input) => {
               await agent.run(input);
               promptUser();
            },
            fail: (error) => {
              console.error('Error:', error);
              promptUser();
            }
          })
        };
        
        promptUser();
    }
})

runProgram()
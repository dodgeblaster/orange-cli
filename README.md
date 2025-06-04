# Orange CLI

A command-line interface for interacting with AI models through a chat interface, with built-in tools for file system operations and command execution.

## Features

- Interactive chat interface with AI models
- File system operations (read, write, search)
- Command execution with safety checks
- Diff visualization for file changes
- Context-aware responses based on your project structure
- Support for multiple AI models

## Installation

```bash
npm i -g @orangeteam/cli
```

## Usage

Start a chat session:

```bash
orange-cli chat
```

Specify a model to use:

```bash
orange-cli chat --model <model-name>
```

Available model options:
- `premier` - Amazon Nova Premier
- `micro` - Amazon Nova Micro (default)
- `lite` - Amazon Nova Lite
- `claude35` - Claude 3.5 Sonnet
- `claude37` - Claude 3.7 Sonnet
- `claude3`- Claude 3 Sonnet

### Available Commands

- `/quit` - Exit the chat session

### Chat Interface

The chat interface allows you to:
- Ask questions about your code and project
- Request file operations (read, write, modify)
- Execute shell commands with confirmation for potentially dangerous operations
- Get context-aware assistance based on your project structure

## Supported AI Models

Orange CLI supports multiple AI models:
- Amazon Nova Premier
- Amazon Nova Micro
- Amazon Nova Lite
- Claude 3.5 Sonnet
- Claude 3.7 Sonnet
- Claude 3 Sonnet

## Tools

### File System Tools

- **Read Files**: Read file contents, list directories, or search for patterns
- **Write Files**: Create, append to, or modify existing files
- **File Diff**: Visualize changes to files with color-coded diffs

### Command Execution

Execute bash commands with safety checks for potentially dangerous operations.

## Project Structure

```
orange-cli/
├── index.mjs              # Main entry point
├── util_terminal.mjs      # Terminal utilities
├── util_context.mjs       # Project context builder
├── tool_execute-bash.mjs  # Bash execution tool
├── tool_fs_read.mjs       # File system read tool
└── tool_fs_write.mjs      # File system write tool
```

## Dependencies

- `orange-llm`: LLM client library
- `orange-agent`: Agent framework for tool execution
- `diff`: Library for generating text diffs

## Configuration

Orange CLI automatically detects your project structure and provides context-aware assistance. No additional configuration is required for basic usage.

## Security

- Commands that could potentially be dangerous require explicit confirmation
- File operations are performed with appropriate safety checks
- Sensitive operations are clearly highlighted

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

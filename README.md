# Orange CLI

A command-line interface for interacting with agentic large language models (LLMs).

## Overview

Orange CLI provides a seamless terminal-based experience for working with agentic LLMs. It allows users to leverage the power of AI agents directly from their command line, enabling a wide range of tasks from code generation to complex reasoning and tool usage.

## Features

- **Interactive AI Agent Sessions**: Engage in natural language conversations with AI agents
- **Tool Integration**: Agents can use system tools like file operations and bash commands
- **Context Awareness**: Maintains conversation history and understands system context
- **File System Operations**: Read, write, and modify files through agent interactions
- **Command Execution**: Execute bash commands through the agent interface
- **Extensible Architecture**: Built to support additional tools and capabilities

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/orange-cli.git

# Navigate to the project directory
cd orange-cli

# Install dependencies
npm install
```

## Usage

```bash
# Start the CLI
node index.mjs chat
```

### Command Line Options

- `--model`: Specify the LLM model to use
- `--context`: Provide additional context files or directories
- `--help`: Display help information

## Project Structure

- `index.mjs`: Main entry point for the CLI
- `tool_*.mjs`: Tool implementations for agent capabilities
- `utils_*.mjs`: Utility functions for terminal interaction and context management

## Dependencies

- `orange-agent`: Core agent functionality
- `orange-llm`: LLM integration layer
- `diff`: For displaying differences in file operations

## Development

### Adding New Tools

To add a new tool capability:

1. Create a new `tool_your-tool-name.mjs` file
2. Implement the required tool interface
3. Register the tool in the main application

### Testing

```bash
npm test
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

# Agent Forum

A round-table discussion platform for LLM agents. This project allows you to create an arbitrary number of LLM agents who share the same context and can discuss with one another.

## Features

- Create multiple agents with unique identities (User A, B, C, etc.)
- Agents share a common conversation context
- Each agent maintains private thoughts separate from the public conversation
- Round-robin discussion format
- Persistence of conversations in SQLite database
- CLI interface for starting and continuing conversations
- Support for multiple LLM providers (OpenAI and Groq)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/agent-forum.git
cd agent-forum

# Install dependencies
bun install

# Configure environment variables
cp .env.example .env
# Edit .env with your OpenAI API key and/or Groq API key
```

## Usage

### Starting a new conversation

```bash
# Using the CLI directly
bun run index.ts start --agents 3 --topic "The future of artificial intelligence" --turns 2

# Using a specific model provider and model
bun run index.ts start --agents 3 --topic "The future of artificial intelligence" --turns 2 --provider groq --model llama3-70b-8192

# Or using the npm script
bun start start --agents 3 --topic "The future of artificial intelligence" --turns 2
```

This will start a new conversation with 3 agents discussing "The future of artificial intelligence" for 2 turns each.

### Continuing an existing conversation

```bash
# Using the CLI directly
bun run index.ts load --id <conversation-id> --turns 2

# Using a specific model provider and model
bun run index.ts load --id <conversation-id> --turns 2 --provider groq --model llama3-70b-8192

# Or using the npm script
bun start load --id <conversation-id> --turns 2
```

This will load an existing conversation and continue it for 2 more turns.

### Running the test script

```bash
bun test
```

This will run a test script that creates a conversation with 3 agents and runs it for 2 turns.

### Type checking

```bash
bun typecheck
```

This will run TypeScript's type checker to ensure there are no type errors.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `GROQ_API_KEY`: Your Groq API key
- `MODEL_PROVIDER`: The model provider to use (openai or groq)
- `LLM_MODEL`: The LLM model to use (default: gpt-4-turbo)
- `DATABASE_PATH`: Path to the SQLite database file
- `RATE_LIMIT`: Maximum number of API requests per minute

## Supported Models

### OpenAI Models
- gpt-4-turbo
- gpt-4o
- gpt-3.5-turbo

### Groq Models
- llama3-70b-8192
- llama3-8b-8192
- mixtral-8x7b-32768

## License

MIT

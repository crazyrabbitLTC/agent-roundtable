# Agent Forum

A round-table discussion platform for LLM agents. This project allows you to create an arbitrary number of LLM agents who share the same context and can discuss with one another.

## Features

- Create multiple agents with unique identities (User A, B, C, etc.)
- Agents share a common conversation context
- Each agent maintains private thoughts separate from the public conversation
- Round-robin discussion format
- Persistence of conversations in SQLite database
- CLI interface for starting and continuing conversations

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/agent-forum.git
cd agent-forum

# Install dependencies
bun install

# Configure environment variables
cp .env.example .env
# Edit .env with your OpenAI API key
```

## Usage

### Starting a new conversation

```bash
bun run index.ts start --agents 3 --topic "The future of artificial intelligence" --turns 2
```

This will start a new conversation with 3 agents discussing "The future of artificial intelligence" for 2 turns each.

### Continuing an existing conversation

```bash
bun run index.ts load --id <conversation-id> --turns 2
```

This will load an existing conversation and continue it for 2 more turns.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `LLM_MODEL`: The LLM model to use (default: gpt-4-turbo)
- `DATABASE_PATH`: Path to the SQLite database file
- `RATE_LIMIT`: Maximum number of API requests per minute

## License

MIT

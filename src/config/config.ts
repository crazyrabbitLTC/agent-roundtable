import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
config();

export interface Config {
  openaiApiKey: string;
  llmModel: string;
  databasePath: string;
  rateLimit: number;
}

export const appConfig: Config = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  llmModel: process.env.LLM_MODEL || 'gpt-4-turbo',
  databasePath: process.env.DATABASE_PATH || './data/agent_forum.db',
  rateLimit: parseInt(process.env.RATE_LIMIT || '60', 10),
};

// Validate config
if (!appConfig.openaiApiKey) {
  console.error('Error: OPENAI_API_KEY is required in .env file');
  process.exit(1);
}

// Ensure database directory exists
const dbDir = path.dirname(appConfig.databasePath);
try {
  fs.mkdirSync(dbDir, { recursive: true });
} catch (error) {
  console.error(`Error creating database directory: ${error}`);
  process.exit(1);
}

export default appConfig; 
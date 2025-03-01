import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
config();

export type ModelProvider = 'openai' | 'groq';

export interface Config {
  openaiApiKey: string;
  groqApiKey: string;
  modelProvider: ModelProvider;
  llmModel: string;
  databasePath: string;
  rateLimit: number;
}

export const appConfig: Config = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  modelProvider: (process.env.MODEL_PROVIDER as ModelProvider) || 'openai',
  llmModel: process.env.LLM_MODEL || 'gpt-4-turbo',
  databasePath: process.env.DATABASE_PATH || './data/agent_forum.db',
  rateLimit: parseInt(process.env.RATE_LIMIT || '60', 10),
};

// Validate config
if (appConfig.modelProvider === 'openai' && !appConfig.openaiApiKey) {
  console.error('Error: OPENAI_API_KEY is required in .env file when using OpenAI provider');
  process.exit(1);
}

if (appConfig.modelProvider === 'groq' && !appConfig.groqApiKey) {
  console.error('Error: GROQ_API_KEY is required in .env file when using Groq provider');
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
import { Command } from 'commander';
import { LlmService } from './services/llm-service';
import { DatabaseService } from './db/database';
import { AgentService } from './services/agent-service';
import { appConfig } from './config/config';
import type { StartConversationOptions } from './types';
import type { ModelProvider } from './config/config';

const program = new Command();

// Initialize services
const llmService = new LlmService();
const dbService = new DatabaseService();
const agentService = new AgentService(llmService, dbService);

program
  .name('agent-forum')
  .description('A CLI for creating and running conversations between LLM agents')
  .version('1.0.0');

program
  .command('start')
  .description('Start a new conversation')
  .requiredOption('-a, --agents <number>', 'Number of agents', parseInt)
  .requiredOption('-t, --topic <string>', 'Conversation topic')
  .option('-r, --turns <number>', 'Number of turns', parseInt, 3)
  .option('-p, --provider <string>', 'Model provider (openai or groq)', validateProvider, appConfig.modelProvider)
  .option('-m, --model <string>', 'Model name', appConfig.llmModel)
  .action(async (options: StartConversationOptions & { provider?: ModelProvider; model?: string }) => {
    try {
      // Set model provider and model if specified
      if (options.provider) {
        process.env.MODEL_PROVIDER = options.provider;
      }
      
      if (options.model) {
        process.env.LLM_MODEL = options.model;
      }
      
      console.log(`Starting a new conversation with ${options.agents} agents on topic: "${options.topic}"`);
      console.log(`Using model provider: ${process.env.MODEL_PROVIDER}, model: ${process.env.LLM_MODEL}`);
      
      // Create conversation
      const conversation = agentService.createConversation(options.topic, options.agents);
      
      // Run conversation
      await agentService.runConversation(conversation, options.turns);
      
      console.log(`Conversation completed. Conversation ID: ${conversation.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      process.exit(1);
    } finally {
      // Close database connection
      dbService.close();
    }
  });

program
  .command('load')
  .description('Load and continue an existing conversation')
  .requiredOption('-i, --id <string>', 'Conversation ID')
  .requiredOption('-r, --turns <number>', 'Number of additional turns', parseInt)
  .option('-p, --provider <string>', 'Model provider (openai or groq)', validateProvider, appConfig.modelProvider)
  .option('-m, --model <string>', 'Model name', appConfig.llmModel)
  .action(async (options: { id: string; turns: number; provider?: ModelProvider; model?: string }) => {
    try {
      // Set model provider and model if specified
      if (options.provider) {
        process.env.MODEL_PROVIDER = options.provider;
      }
      
      if (options.model) {
        process.env.LLM_MODEL = options.model;
      }
      
      console.log(`Loading conversation with ID: ${options.id}`);
      console.log(`Using model provider: ${process.env.MODEL_PROVIDER}, model: ${process.env.LLM_MODEL}`);
      
      // Load conversation
      const conversation = agentService.loadConversation(options.id);
      
      if (!conversation) {
        console.error(`Conversation with ID ${options.id} not found`);
        process.exit(1);
      }
      
      console.log(`Continuing conversation on topic: "${conversation.topic}" with ${conversation.agents.length} agents`);
      
      // Run conversation
      await agentService.runConversation(conversation, options.turns);
      
      console.log('Conversation completed.');
    } catch (error) {
      console.error('Error loading conversation:', error);
      process.exit(1);
    } finally {
      // Close database connection
      dbService.close();
    }
  });

/**
 * Validate the model provider
 */
function validateProvider(value: string): ModelProvider {
  if (value !== 'openai' && value !== 'groq') {
    throw new Error('Model provider must be either "openai" or "groq"');
  }
  return value as ModelProvider;
}

export const runCli = (): void => {
  program.parse(process.argv);
}; 
import { Command } from 'commander';
import { LlmService } from './services/llm-service';
import { DatabaseService } from './db/database';
import { AgentService } from './services/agent-service';
import type { StartConversationOptions } from './types';

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
  .action(async (options: StartConversationOptions) => {
    try {
      console.log(`Starting a new conversation with ${options.agents} agents on topic: "${options.topic}"`);
      
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
  .action(async (options: { id: string; turns: number }) => {
    try {
      console.log(`Loading conversation with ID: ${options.id}`);
      
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

export const runCli = (): void => {
  program.parse(process.argv);
}; 
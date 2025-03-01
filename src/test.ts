import { LlmService } from './services/llm-service';
import { DatabaseService } from './db/database';
import { AgentService } from './services/agent-service';

/**
 * Test script to verify the Agent Forum implementation
 */
async function runTest() {
  console.log('Starting Agent Forum test...');
  
  // Initialize services
  const llmService = new LlmService();
  const dbService = new DatabaseService();
  const agentService = new AgentService(llmService, dbService);
  
  try {
    // Create a conversation with 3 agents
    const topic = 'The benefits and risks of artificial intelligence';
    const numAgents = 3;
    const numTurns = 2;
    
    console.log(`Creating conversation with ${numAgents} agents on topic: "${topic}"`);
    const conversation = agentService.createConversation(topic, numAgents);
    
    console.log(`Conversation created with ID: ${conversation.id}`);
    console.log(`Agents: ${conversation.agents.map(agent => agent.name).join(', ')}`);
    
    // Run the conversation
    console.log(`Running conversation for ${numTurns} turns...`);
    await agentService.runConversation(conversation, numTurns);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Close database connection
    dbService.close();
  }
}

// Run the test
runTest().catch(console.error); 
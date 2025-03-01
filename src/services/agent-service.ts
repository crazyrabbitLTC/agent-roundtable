import { v4 as uuidv4 } from 'uuid';
import type { Agent, AgentResponse, Conversation, Message } from '../types';
import { LlmService } from './llm-service';
import { DatabaseService } from '../db/database';

/**
 * Service for managing agents and their interactions
 */
export class AgentService {
  private llmService: LlmService;
  private dbService: DatabaseService;
  private baseSystemPrompt: string = `You are an intelligent agent participating in a round-table discussion with other agents. 
Your goal is to engage in thoughtful conversation, share insights, and respond to other participants.
Be respectful, insightful, and contribute meaningfully to the discussion.`;

  constructor(llmService: LlmService, dbService: DatabaseService) {
    this.llmService = llmService;
    this.dbService = dbService;
  }

  /**
   * Create a new conversation with the specified number of agents
   * @param topic - The topic of the conversation
   * @param numAgents - The number of agents to create
   * @returns The created conversation
   */
  createConversation(topic: string, numAgents: number): Conversation {
    const conversationId = uuidv4();
    const now = Date.now();

    // Create conversation in database
    this.dbService.createConversation({
      id: conversationId,
      topic,
      created_at: now,
      updated_at: now,
    });

    // Create agents
    const agents: Agent[] = [];
    for (let i = 0; i < numAgents; i++) {
      const agentId = uuidv4();
      const agentName = `User ${String.fromCharCode(65 + i)}`; // A, B, C, etc.
      const systemPrompt = this.baseSystemPrompt;

      // Create agent in database
      this.dbService.createAgent({
        id: agentId,
        conversation_id: conversationId,
        name: agentName,
        system_prompt: systemPrompt,
      });

      agents.push({
        id: agentId,
        name: agentName,
        systemPrompt,
        privateThoughts: [],
      });
    }

    // Create initial message (the topic)
    const initialMessageId = uuidv4();
    const initialMessage: Message = {
      id: initialMessageId,
      conversationId,
      agentId: null,
      agentName: null,
      content: `Let's discuss the following topic: ${topic}`,
      isPrivate: false,
      timestamp: now,
    };

    // Save initial message to database
    this.dbService.createMessage({
      id: initialMessageId,
      conversation_id: conversationId,
      agent_id: null,
      agent_name: null,
      content: initialMessage.content,
      is_private: false,
      timestamp: now,
    });

    return {
      id: conversationId,
      topic,
      messages: [initialMessage],
      agents,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Generate a response from an agent
   * @param conversation - The conversation
   * @param agentIndex - The index of the agent in the conversation's agents array
   * @returns The updated conversation
   */
  async generateAgentResponse(conversation: Conversation, agentIndex: number): Promise<Conversation> {
    const agent = conversation.agents[agentIndex];
    if (!agent) {
      throw new Error(`Agent at index ${agentIndex} not found`);
    }

    // Get public messages
    const publicMessages = conversation.messages.filter(msg => !msg.isPrivate);

    // Get agent's private thoughts
    const privateThoughts = agent.privateThoughts;

    // Generate response
    const response: AgentResponse = await this.llmService.generateAgentResponse(
      agent.name,
      agent.systemPrompt,
      publicMessages,
      privateThoughts
    );

    const now = Date.now();

    // Create public message
    const publicMessageId = uuidv4();
    const publicMessage: Message = {
      id: publicMessageId,
      conversationId: conversation.id,
      agentId: agent.id,
      agentName: agent.name,
      content: response.publicResponse,
      isPrivate: false,
      timestamp: now,
    };

    // Save public message to database
    this.dbService.createMessage({
      id: publicMessageId,
      conversation_id: conversation.id,
      agent_id: agent.id,
      agent_name: agent.name,
      content: response.publicResponse,
      is_private: false,
      timestamp: now,
    });

    // Create private thought
    const privateThoughtId = uuidv4();
    const privateThought: Message = {
      id: privateThoughtId,
      conversationId: conversation.id,
      agentId: agent.id,
      agentName: agent.name,
      content: response.privateThoughts,
      isPrivate: true,
      timestamp: now,
    };

    // Save private thought to database
    this.dbService.createMessage({
      id: privateThoughtId,
      conversation_id: conversation.id,
      agent_id: agent.id,
      agent_name: agent.name,
      content: response.privateThoughts,
      is_private: true,
      timestamp: now,
    });

    // Update conversation
    conversation.messages.push(publicMessage);
    agent.privateThoughts.push(privateThought);
    conversation.updatedAt = now;

    // Update conversation in database
    this.dbService.updateConversation({
      id: conversation.id,
      topic: conversation.topic,
      created_at: conversation.createdAt,
      updated_at: now,
    });

    return conversation;
  }

  /**
   * Run a conversation for a specified number of turns
   * @param conversation - The conversation
   * @param numTurns - The number of turns to run
   * @returns The updated conversation
   */
  async runConversation(conversation: Conversation, numTurns: number): Promise<Conversation> {
    const numAgents = conversation.agents.length;
    let currentConversation = { ...conversation };

    console.log(`Starting conversation on topic: ${conversation.topic}`);
    console.log(`Initial message: ${conversation.messages[0].content}`);
    console.log('---');

    for (let turn = 0; turn < numTurns; turn++) {
      console.log(`Turn ${turn + 1}/${numTurns}`);

      for (let agentIndex = 0; agentIndex < numAgents; agentIndex++) {
        const agent = currentConversation.agents[agentIndex];
        console.log(`${agent.name}'s turn...`);

        currentConversation = await this.generateAgentResponse(currentConversation, agentIndex);

        // Get the latest message
        const latestMessage = currentConversation.messages[currentConversation.messages.length - 1];
        console.log(`${latestMessage.agentName}: ${latestMessage.content}`);
        console.log('---');
      }
    }

    return currentConversation;
  }

  /**
   * Load a conversation from the database
   * @param conversationId - The ID of the conversation to load
   * @returns The loaded conversation, or null if not found
   */
  loadConversation(conversationId: string): Conversation | null {
    return this.dbService.loadConversation(conversationId);
  }
} 
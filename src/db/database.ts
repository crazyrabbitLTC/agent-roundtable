import { Database } from 'bun:sqlite';
import { appConfig } from '../config/config';
import type { 
  DbAgent, 
  DbConversation, 
  DbMessage, 
  Agent, 
  Message, 
  Conversation 
} from '../types';

/**
 * Database service for managing conversations, agents, and messages
 */
export class DatabaseService {
  private db: Database;

  constructor() {
    this.db = new Database(appConfig.databasePath);
    this.initialize();
  }

  /**
   * Initialize the database schema
   */
  private initialize(): void {
    // Create conversations table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Create agents table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        name TEXT NOT NULL,
        system_prompt TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      )
    `);

    // Create messages table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        agent_id TEXT,
        agent_name TEXT,
        content TEXT NOT NULL,
        is_private BOOLEAN NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id),
        FOREIGN KEY (agent_id) REFERENCES agents(id)
      )
    `);
  }

  /**
   * Create a new conversation
   */
  createConversation(conversation: DbConversation): void {
    this.db.run(
      'INSERT INTO conversations (id, topic, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [conversation.id, conversation.topic, conversation.created_at, conversation.updated_at]
    );
  }

  /**
   * Create a new agent
   */
  createAgent(agent: DbAgent): void {
    this.db.run(
      'INSERT INTO agents (id, conversation_id, name, system_prompt) VALUES (?, ?, ?, ?)',
      [agent.id, agent.conversation_id, agent.name, agent.system_prompt]
    );
  }

  /**
   * Create a new message
   */
  createMessage(message: DbMessage): void {
    this.db.run(
      'INSERT INTO messages (id, conversation_id, agent_id, agent_name, content, is_private, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        message.id,
        message.conversation_id,
        message.agent_id,
        message.agent_name,
        message.content,
        message.is_private ? 1 : 0,
        message.timestamp
      ]
    );
  }

  /**
   * Get a conversation by ID
   */
  getConversation(id: string): DbConversation | null {
    return this.db.query<DbConversation, [string]>('SELECT * FROM conversations WHERE id = ?').get(id) || null;
  }

  /**
   * Get all agents for a conversation
   */
  getAgentsForConversation(conversationId: string): DbAgent[] {
    return this.db.query<DbAgent, [string]>('SELECT * FROM agents WHERE conversation_id = ?').all(conversationId);
  }

  /**
   * Get all public messages for a conversation
   */
  getPublicMessagesForConversation(conversationId: string): DbMessage[] {
    return this.db.query<DbMessage, [string]>(
      'SELECT * FROM messages WHERE conversation_id = ? AND is_private = 0 ORDER BY timestamp ASC'
    ).all(conversationId);
  }

  /**
   * Get all private messages for an agent
   */
  getPrivateMessagesForAgent(agentId: string): DbMessage[] {
    return this.db.query<DbMessage, [string]>(
      'SELECT * FROM messages WHERE agent_id = ? AND is_private = 1 ORDER BY timestamp ASC'
    ).all(agentId);
  }

  /**
   * Load a complete conversation with all agents and messages
   */
  loadConversation(conversationId: string): Conversation | null {
    const dbConversation = this.getConversation(conversationId);
    if (!dbConversation) return null;

    const dbAgents = this.getAgentsForConversation(conversationId);
    const dbPublicMessages = this.getPublicMessagesForConversation(conversationId);
    
    // Convert DB agents to application agents
    const agents: Agent[] = dbAgents.map(dbAgent => {
      const privateMessages = this.getPrivateMessagesForAgent(dbAgent.id).map(this.dbMessageToMessage);
      
      return {
        id: dbAgent.id,
        name: dbAgent.name,
        systemPrompt: dbAgent.system_prompt,
        privateThoughts: privateMessages
      };
    });

    // Convert DB messages to application messages
    const messages: Message[] = dbPublicMessages.map(this.dbMessageToMessage);

    return {
      id: dbConversation.id,
      topic: dbConversation.topic,
      messages,
      agents,
      createdAt: dbConversation.created_at,
      updatedAt: dbConversation.updated_at
    };
  }

  /**
   * Convert a DB message to an application message
   */
  private dbMessageToMessage(dbMessage: DbMessage): Message {
    return {
      id: dbMessage.id,
      conversationId: dbMessage.conversation_id,
      agentId: dbMessage.agent_id,
      agentName: dbMessage.agent_name,
      content: dbMessage.content,
      isPrivate: Boolean(dbMessage.is_private),
      timestamp: dbMessage.timestamp
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }
} 
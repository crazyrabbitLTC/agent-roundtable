// Agent types
export interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
  privateThoughts: Message[];
}

// Message types
export interface Message {
  id: string;
  conversationId: string;
  agentId: string | null; // null for user messages
  agentName: string | null; // null for user messages
  content: string;
  isPrivate: boolean;
  timestamp: number;
}

// Conversation types
export interface Conversation {
  id: string;
  topic: string;
  messages: Message[];
  agents: Agent[];
  createdAt: number;
  updatedAt: number;
}

// Response from LLM agent
export interface AgentResponse {
  publicResponse: string;
  privateThoughts: string;
}

// CLI command options
export interface StartConversationOptions {
  agents: number;
  topic: string;
  turns: number;
}

// Database schema types
export interface DbConversation {
  id: string;
  topic: string;
  created_at: number;
  updated_at: number;
}

export interface DbAgent {
  id: string;
  conversation_id: string;
  name: string;
  system_prompt: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  agent_id: string | null;
  agent_name: string | null;
  content: string;
  is_private: boolean;
  timestamp: number;
} 
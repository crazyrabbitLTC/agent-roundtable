import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { appConfig } from '../config/config';
import type { ModelProvider } from '../config/config';
import type { AgentResponse, Message } from '../types';

/**
 * Service for interacting with LLM APIs (OpenAI or Groq)
 */
export class LlmService {
  private openai: OpenAI | null = null;
  private groq: Groq | null = null;
  private requestCount: number = 0;
  private lastResetTime: number = Date.now();
  private rateLimit: number;
  private modelProvider: ModelProvider;

  constructor() {
    this.modelProvider = appConfig.modelProvider;
    
    // Initialize the appropriate client based on the provider
    if (this.modelProvider === 'openai') {
      this.openai = new OpenAI({
        apiKey: appConfig.openaiApiKey,
      });
    } else if (this.modelProvider === 'groq') {
      this.groq = new Groq({
        apiKey: appConfig.groqApiKey,
      });
    }
    
    this.rateLimit = appConfig.rateLimit;
  }

  /**
   * Generate a response from an agent
   * @param agentName - The name of the agent
   * @param systemPrompt - The system prompt for the agent
   * @param messages - The conversation history
   * @param privateThoughts - The agent's private thoughts
   * @returns The agent's response
   */
  async generateAgentResponse(
    agentName: string,
    systemPrompt: string,
    messages: Message[],
    privateThoughts: Message[]
  ): Promise<AgentResponse> {
    // Check rate limiting
    await this.checkRateLimit();

    // Format messages for the API
    const formattedMessages = this.formatMessagesForApi(agentName, systemPrompt, messages, privateThoughts);

    try {
      let responseContent: string;
      
      if (this.modelProvider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: appConfig.llmModel,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });
        
        responseContent = response.choices[0]?.message?.content || '';
      } else if (this.modelProvider === 'groq' && this.groq) {
        const response = await this.groq.chat.completions.create({
          model: appConfig.llmModel,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });
        
        responseContent = response.choices[0]?.message?.content || '';
      } else {
        throw new Error(`Unsupported model provider: ${this.modelProvider}`);
      }

      // Increment request count for rate limiting
      this.requestCount++;

      // Parse the response to extract public and private parts
      return this.parseAgentResponse(responseContent);
    } catch (error) {
      console.error(`Error generating agent response with ${this.modelProvider}:`, error);
      return {
        publicResponse: `${agentName} is unable to respond at the moment.`,
        privateThoughts: `Error generating response: ${error}`,
      };
    }
  }

  /**
   * Format messages for the API
   */
  private formatMessagesForApi(
    agentName: string,
    systemPrompt: string,
    messages: Message[],
    privateThoughts: Message[]
  ): any[] {
    // Create the system message with the agent's name
    const systemMessage = {
      role: 'system',
      content: `${systemPrompt}\n\nYour name is ${agentName}. You are participating in a round-table discussion with other agents.\n\nYour response should be in the following format:\n\nPUBLIC RESPONSE:\n[Your message that will be shared with all participants]\n\nPRIVATE THOUGHTS:\n[Your private thoughts that only you will see]`,
    };

    // Format conversation history
    const historyMessages = messages.map(msg => {
      if (msg.agentName) {
        return {
          role: 'assistant',
          content: `${msg.agentName}: ${msg.content}`,
        };
      } else {
        return {
          role: 'user',
          content: msg.content,
        };
      }
    });

    // Format private thoughts as system messages
    const privateThoughtsMessages = privateThoughts.length > 0
      ? [
          {
            role: 'system',
            content: 'Your previous private thoughts (only visible to you):\n\n' +
              privateThoughts.map(thought => `- ${thought.content}`).join('\n\n'),
          },
        ]
      : [];

    // Combine all messages
    return [systemMessage, ...privateThoughtsMessages, ...historyMessages];
  }

  /**
   * Parse the agent's response to extract public and private parts
   */
  private parseAgentResponse(responseText: string): AgentResponse {
    // Default values in case parsing fails
    let publicResponse = responseText;
    let privateThoughts = '';

    // Try to extract public and private parts
    const publicMatch = responseText.match(/PUBLIC RESPONSE:\s*([\s\S]*?)(?=PRIVATE THOUGHTS:|$)/i);
    const privateMatch = responseText.match(/PRIVATE THOUGHTS:\s*([\s\S]*?)$/i);

    if (publicMatch && publicMatch[1]) {
      publicResponse = publicMatch[1].trim();
      
      // Remove any agent name prefix that might have been added by the model
      // This regex will match patterns like "User A: User A: User A: " at the beginning of the string
      // The global flag ensures all occurrences are replaced
      publicResponse = publicResponse.replace(/^(User [A-Z]+:\s*)+/g, '');
      
      // Also remove any redundant name prefixes that might appear in the middle of the text
      // This handles cases where the model repeats the name prefix in the response
      publicResponse = publicResponse.replace(/(User [A-Z]+:\s*){2,}/g, '');
    }

    if (privateMatch && privateMatch[1]) {
      privateThoughts = privateMatch[1].trim();
    }

    return { publicResponse, privateThoughts };
  }

  /**
   * Check rate limiting and wait if necessary
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsedMs = now - this.lastResetTime;

    // Reset counter if a minute has passed
    if (elapsedMs >= 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
      return;
    }

    // If we've hit the rate limit, wait until the minute is up
    if (this.requestCount >= this.rateLimit) {
      const waitTimeMs = 60000 - elapsedMs;
      console.log(`Rate limit reached. Waiting ${waitTimeMs / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTimeMs));
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }
  }
} 
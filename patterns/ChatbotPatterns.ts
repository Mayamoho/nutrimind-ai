/**
 * Chatbot Design Patterns
 * 
 * This file documents the design patterns used in the NutriBot chatbot implementation.
 */

/**
 * COMMAND PATTERN
 * Used for encapsulating chat message requests as objects.
 * This allows for:
 * - Parameterizing clients with different requests
 * - Queuing or logging requests
 * - Supporting undoable operations (future: message retry)
 */
export interface ChatCommand {
  execute(): Promise<string>;
}

export class SendMessageCommand implements ChatCommand {
  constructor(
    private message: string,
    private context: string,
    private apiCall: (msg: string, ctx: string) => Promise<{ response: string }>
  ) {}

  async execute(): Promise<string> {
    const response = await this.apiCall(this.message, this.context);
    return response.response;
  }
}

/**
 * STRATEGY PATTERN
 * Used for different response handling strategies.
 * Can be extended for:
 * - Different AI providers (Gemini, OpenAI, local models)
 * - Fallback responses when API is unavailable
 * - Cached responses for common questions
 */
export interface ResponseStrategy {
  getResponse(message: string, context: string): Promise<string>;
}

export class GeminiResponseStrategy implements ResponseStrategy {
  constructor(private apiCall: (msg: string, ctx: string) => Promise<{ response: string }>) {}

  async getResponse(message: string, context: string): Promise<string> {
    const response = await this.apiCall(message, context);
    return response.response;
  }
}

export class FallbackResponseStrategy implements ResponseStrategy {
  private fallbackResponses: Record<string, string> = {
    'hello': 'Hi there! 👋 How can I help you with your health goals today?',
    'help': 'I can help you with nutrition advice, exercise tips, and tracking your health progress!',
    'default': 'I\'m here to help with your health and fitness questions. What would you like to know?',
  };

  async getResponse(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    for (const [key, response] of Object.entries(this.fallbackResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    return this.fallbackResponses.default;
  }
}

/**
 * OBSERVER PATTERN
 * Used for notifying components when new messages arrive.
 * Useful for:
 * - Updating unread message indicators
 * - Triggering notifications
 * - Syncing chat state across components
 */
export interface ChatObserver {
  onNewMessage(message: ChatMessage): void;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export class ChatSubject {
  private observers: ChatObserver[] = [];

  subscribe(observer: ChatObserver): void {
    this.observers.push(observer);
  }

  unsubscribe(observer: ChatObserver): void {
    this.observers = this.observers.filter(o => o !== observer);
  }

  notify(message: ChatMessage): void {
    this.observers.forEach(o => o.onNewMessage(message));
  }
}

/**
 * BUILDER PATTERN
 * Used for constructing complex context strings for the AI.
 */
export class ContextBuilder {
  private context: string[] = [];

  addUserProfile(user: { name: string; weight: number; height: number; age: number; gender: string }): this {
    this.context.push(`User: ${user.name}, ${user.weight}kg, ${user.height}cm, ${user.age}yo, ${user.gender}`);
    return this;
  }

  addTodayProgress(calories: number, exercise: number, water: number): this {
    this.context.push(`Today: ${calories} cal in, ${exercise} cal burned, ${water}ml water`);
    return this;
  }

  addStreak(days: number): this {
    this.context.push(`Streak: ${days} days`);
    return this;
  }

  addGoals(targetWeight: number, goalType: string): this {
    this.context.push(`Goal: ${goalType} to ${targetWeight}kg`);
    return this;
  }

  build(): string {
    return this.context.join('\n');
  }
}

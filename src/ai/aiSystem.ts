/**
 * AI AGENT SYSTEM
 * Manages autonomous AI agents with memory, goals, and learning
 */

import { v4 as uuidv4 } from 'uuid';
import { storage } from '@kernel/storage';
import { processManager } from '@kernel/process';
import type { AIAgent, AIMemory, AIGoal, AIPersonality } from '@kernel/types';

export class AISystem {
  private static instance: AISystem;
  private activeAgents: Map<string, AIAgent> = new Map();

  private constructor() {}

  static getInstance(): AISystem {
    if (!AISystem.instance) {
      AISystem.instance = new AISystem();
    }
    return AISystem.instance;
  }

  async initialize(): Promise<void> {
    // Create default assistant for each user
    console.log('🤖 AI System initialized');
  }

  // ============================================================================
  // AGENT CREATION & MANAGEMENT
  // ============================================================================

  async createAgent(
    ownerId: string,
    name: string,
    type: AIAgent['type'] = 'assistant',
    personality?: Partial<AIPersonality>
  ): Promise<AIAgent> {
    const agent: AIAgent = {
      id: uuidv4(),
      name,
      type,
      ownerId,
      personality: {
        creativity: personality?.creativity ?? 0.7,
        formality: personality?.formality ?? 0.5,
        helpfulness: personality?.helpfulness ?? 0.9,
        assertiveness: personality?.assertiveness ?? 0.6,
        traits: personality?.traits ?? ['friendly', 'helpful', 'curious'],
      },
      memory: [],
      goals: [],
      skills: this.getDefaultSkills(type),
      status: 'idle',
      createdAt: new Date(),
      lastActiveAt: new Date(),
      metadata: {},
    };

    await storage.set('agents', agent);
    this.activeAgents.set(agent.id, agent);

    // Spawn process for agent
    await processManager.spawn(`AI Agent: ${name}`, 'agent', {
      permissions: ['ai.execute'],
      environment: { agentId: agent.id },
    });

    console.log(`🤖 Created AI agent: ${name} (${type})`);

    return agent;
  }

  async deleteAgent(agentId: string): Promise<void> {
    const agent = await storage.get('agents', agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Kill agent process
    const processes = processManager.getAllProcesses();
    const agentProc = processes.find(p => 
      p.metadata.environment?.agentId === agentId
    );
    
    if (agentProc) {
      await processManager.kill(agentProc.pid);
    }

    await storage.delete('agents', agentId);
    this.activeAgents.delete(agentId);

    console.log(`🗑️ Deleted AI agent: ${agent.name}`);
  }

  async getAgent(agentId: string): Promise<AIAgent | undefined> {
    return await storage.get('agents', agentId);
  }

  async getAgentsByOwner(ownerId: string): Promise<AIAgent[]> {
    return await storage.getAgentsByOwner(ownerId);
  }

  // ============================================================================
  // CONVERSATION & INTERACTION
  // ============================================================================

  async chat(agentId: string, message: string, context?: any): Promise<string> {
    const agent = await this.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Update status
    agent.status = 'thinking';
    await this.updateAgent(agent);

    // Store conversation in memory
    await this.addMemory(agentId, {
      type: 'conversation',
      content: `User: ${message}`,
      importance: 0.7,
    });

    // Generate response (simple rule-based for now, replace with LLM later)
    const response = await this.generateResponse(agent, message, context);

    // Store response in memory
    await this.addMemory(agentId, {
      type: 'conversation',
      content: `Agent: ${response}`,
      importance: 0.7,
    });

    // Update status
    agent.status = 'idle';
    agent.lastActiveAt = new Date();
    await this.updateAgent(agent);

    return response;
  }

  private async generateResponse(
    agent: AIAgent,
    message: string,
    context?: any
  ): Promise<string> {
    // Simple keyword-based responses (replace with actual LLM inference)
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return `Hello! I'm ${agent.name}, your ${agent.type}. How can I help you today?`;
    }

    if (lowerMessage.includes('help')) {
      return `I can help you with: ${agent.skills.join(', ')}. What would you like to do?`;
    }

    if (lowerMessage.includes('file') || lowerMessage.includes('folder')) {
      return `I can help you manage files and folders. Would you like to create, read, or organize something?`;
    }

    if (lowerMessage.includes('create') || lowerMessage.includes('make')) {
      return `I'd be happy to help you create something! What would you like to make?`;
    }

    if (lowerMessage.includes('learn') || lowerMessage.includes('teach')) {
      return `I'm always learning! Tell me what you'd like me to know, and I'll remember it.`;
    }

    // Use personality to shape response
    const creativity = agent.personality.creativity;
    const formality = agent.personality.formality;

    if (creativity > 0.7) {
      return `Interesting question! Let me think creatively about "${message}"... I believe we could approach this in several innovative ways. What aspect interests you most?`;
    }

    if (formality > 0.7) {
      return `Thank you for your inquiry regarding "${message}". I would be pleased to assist you with this matter. Could you please provide additional details?`;
    }

    return `I understand you're asking about "${message}". Based on my current knowledge and ${agent.memory.length} memories, I'd be happy to help. Could you elaborate on what specifically you'd like to know?`;
  }

  // ============================================================================
  // MEMORY MANAGEMENT
  // ============================================================================

  async addMemory(
    agentId: string,
    memory: Omit<AIMemory, 'id' | 'timestamp' | 'relatedTo'>
  ): Promise<AIMemory> {
    const agent = await this.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const newMemory: AIMemory = {
      id: uuidv4(),
      ...memory,
      timestamp: new Date(),
      relatedTo: [],
    };

    agent.memory.push(newMemory);

    // Limit memory size (keep most important and recent)
    if (agent.memory.length > 1000) {
      agent.memory = agent.memory
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 800);
    }

    await this.updateAgent(agent);

    return newMemory;
  }

  async searchMemory(
    agentId: string,
    query: string,
    limit: number = 10
  ): Promise<AIMemory[]> {
    const agent = await this.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const lowerQuery = query.toLowerCase();

    return agent.memory
      .filter(m => m.content.toLowerCase().includes(lowerQuery))
      .sort((a, b) => {
        // Sort by importance and recency
        const importanceScore = (b.importance - a.importance) * 100;
        const recencyScore = (b.timestamp.getTime() - a.timestamp.getTime()) / 1000000;
        return importanceScore + recencyScore;
      })
      .slice(0, limit);
  }

  // ============================================================================
  // GOAL MANAGEMENT
  // ============================================================================

  async addGoal(
    agentId: string,
    description: string,
    priority: number = 5,
    deadline?: Date
  ): Promise<AIGoal> {
    const agent = await this.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const goal: AIGoal = {
      id: uuidv4(),
      description,
      priority: Math.max(0, Math.min(10, priority)),
      status: 'active',
      progress: 0,
      deadline,
    };

    agent.goals.push(goal);
    await this.updateAgent(agent);

    return goal;
  }

  async updateGoalProgress(
    agentId: string,
    goalId: string,
    progress: number
  ): Promise<void> {
    const agent = await this.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const goal = agent.goals.find(g => g.id === goalId);
    
    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    goal.progress = Math.max(0, Math.min(1, progress));

    if (goal.progress >= 1) {
      goal.status = 'completed';
      
      // Add completion to memory
      await this.addMemory(agentId, {
        type: 'task',
        content: `Completed goal: ${goal.description}`,
        importance: 0.8,
      });
    }

    await this.updateAgent(agent);
  }

  // ============================================================================
  // SKILLS & LEARNING
  // ============================================================================

  async addSkill(agentId: string, skill: string): Promise<void> {
    const agent = await this.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (!agent.skills.includes(skill)) {
      agent.skills.push(skill);
      await this.updateAgent(agent);

      await this.addMemory(agentId, {
        type: 'fact',
        content: `Learned new skill: ${skill}`,
        importance: 0.6,
      });
    }
  }

  private getDefaultSkills(type: AIAgent['type']): string[] {
    const baseSkills = ['conversation', 'memory', 'learning'];

    const typeSkills: Record<AIAgent['type'], string[]> = {
      assistant: ['task-management', 'information-retrieval', 'scheduling'],
      worker: ['automation', 'data-processing', 'file-management'],
      moderator: ['content-moderation', 'rule-enforcement', 'user-management'],
      trader: ['market-analysis', 'trading', 'risk-assessment'],
      custom: [],
    };

    return [...baseSkills, ...typeSkills[type]];
  }

  // ============================================================================
  // PERSONALITY TUNING
  // ============================================================================

  async updatePersonality(
    agentId: string,
    updates: Partial<AIPersonality>
  ): Promise<void> {
    const agent = await this.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.personality = {
      ...agent.personality,
      ...updates,
      creativity: updates.creativity !== undefined 
        ? Math.max(0, Math.min(1, updates.creativity))
        : agent.personality.creativity,
      formality: updates.formality !== undefined
        ? Math.max(0, Math.min(1, updates.formality))
        : agent.personality.formality,
      helpfulness: updates.helpfulness !== undefined
        ? Math.max(0, Math.min(1, updates.helpfulness))
        : agent.personality.helpfulness,
      assertiveness: updates.assertiveness !== undefined
        ? Math.max(0, Math.min(1, updates.assertiveness))
        : agent.personality.assertiveness,
    };

    await this.updateAgent(agent);
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private async updateAgent(agent: AIAgent): Promise<void> {
    await storage.set('agents', agent);
    this.activeAgents.set(agent.id, agent);
  }

  async getActiveAgents(): Promise<AIAgent[]> {
    return Array.from(this.activeAgents.values());
  }
}

export const aiSystem = AISystem.getInstance();

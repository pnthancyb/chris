import {
  users,
  conversations,
  messages,
  files,
  userMemory,
  type User,
  type UpsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type File,
  type InsertFile,
  type UserMemory,
  type InsertUserMemory,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPreferences(userId: string, preferences: any): Promise<User>;

  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number, userId: string): Promise<Conversation | undefined>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: number, userId: string): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: number): Promise<Message[]>;
  updateMessage(id: number, updates: Partial<Message>): Promise<Message>;
  deleteMessage(id: number): Promise<void>;

  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFile(id: number, userId: string): Promise<File | undefined>;
  getUserFiles(userId: string): Promise<File[]>;
  updateFileProcessing(id: number, processed: boolean, extractedText?: string): Promise<File>;
  deleteFile(id: number, userId: string): Promise<void>;

  // Memory operations
  createMemory(memory: InsertUserMemory): Promise<UserMemory>;
  getUserMemory(userId: string, key?: string): Promise<UserMemory[]>;
  updateMemory(id: number, value: string): Promise<UserMemory>;
  deleteMemory(id: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ preferences, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Conversation operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getConversation(id: number, userId: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    return conversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation> {
    const [conversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation;
  }

  async deleteConversation(id: number, userId: string): Promise<void> {
    // Delete messages first (foreign key constraint)
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getConversationMessages(conversationId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async updateMessage(id: number, updates: Partial<Message>): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // File operations
  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
  }

  async getFile(id: number, userId: string): Promise<File | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.userId, userId)));
    return file;
  }

  async getUserFiles(userId: string): Promise<File[]> {
    return db
      .select()
      .from(files)
      .where(eq(files.userId, userId))
      .orderBy(desc(files.createdAt));
  }

  async updateFileProcessing(id: number, processed: boolean, extractedText?: string): Promise<File> {
    const [file] = await db
      .update(files)
      .set({ processed, extractedText })
      .where(eq(files.id, id))
      .returning();
    return file;
  }

  async deleteFile(id: number, userId: string): Promise<void> {
    await db
      .delete(files)
      .where(and(eq(files.id, id), eq(files.userId, userId)));
  }

  // Memory operations
  async createMemory(memory: InsertUserMemory): Promise<UserMemory> {
    const [newMemory] = await db.insert(userMemory).values(memory).returning();
    return newMemory;
  }

  async getUserMemory(userId: string, key?: string): Promise<UserMemory[]> {
    const conditions = [eq(userMemory.userId, userId)];
    if (key) {
      conditions.push(eq(userMemory.key, key));
    }
    
    return db
      .select()
      .from(userMemory)
      .where(and(...conditions))
      .orderBy(desc(userMemory.createdAt));
  }

  async updateMemory(id: number, value: string): Promise<UserMemory> {
    const [memory] = await db
      .update(userMemory)
      .set({ value, updatedAt: new Date() })
      .where(eq(userMemory.id, id))
      .returning();
    return memory;
  }

  async deleteMemory(id: number, userId: string): Promise<void> {
    await db
      .delete(userMemory)
      .where(and(eq(userMemory.id, id), eq(userMemory.userId, userId)));
  }
}

export const storage = new DatabaseStorage();

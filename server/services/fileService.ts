import fs from "fs";
import path from "path";
import { promisify } from "util";
import { exec } from "child_process";
import { storage } from "../storage";
import { groqService } from "./groqService";
import type { File } from "@shared/schema";

const execAsync = promisify(exec);

class FileService {
  private readonly SUPPORTED_FORMATS = {
    // Text formats
    'text/plain': this.extractTextContent,
    'text/markdown': this.extractTextContent,
    'text/csv': this.extractTextContent,
    
    // Document formats
    'application/pdf': this.extractPDFText,
    'application/msword': this.extractDocText,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.extractDocxText,
    
    // Image formats
    'image/jpeg': this.extractImageContent,
    'image/png': this.extractImageContent,
    'image/gif': this.extractImageContent,
    'image/webp': this.extractImageContent,
    
    // Audio formats
    'audio/mpeg': this.extractAudioContent,
    'audio/wav': this.extractAudioContent,
    'audio/ogg': this.extractAudioContent,
  };

  async processFile(file: File): Promise<void> {
    try {
      const processor = this.SUPPORTED_FORMATS[file.mimeType as keyof typeof this.SUPPORTED_FORMATS];
      
      if (!processor) {
        console.warn(`Unsupported file type: ${file.mimeType}`);
        await storage.updateFileProcessing(file.id, true, "Unsupported file type");
        return;
      }

      const extractedText = await processor.call(this, file.path);
      await storage.updateFileProcessing(file.id, true, extractedText);
      
      console.log(`Successfully processed file: ${file.originalName}`);
    } catch (error) {
      console.error(`Error processing file ${file.originalName}:`, error);
      await storage.updateFileProcessing(file.id, true, `Error: ${error.message}`);
    }
  }

  private async extractTextContent(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8');
  }

  private async extractPDFText(filePath: string): Promise<string> {
    try {
      // Use pdf-parse library for better PDF text extraction
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF parsing failed, trying fallback method:', error);
      try {
        // Fallback to pdftotext if available
        const { stdout } = await execAsync(`pdftotext "${filePath}" -`);
        return stdout;
      } catch (fallbackError) {
        throw new Error(`Failed to extract PDF text: ${error.message}`);
      }
    }
  }

  private async extractDocText(filePath: string): Promise<string> {
    try {
      // Use antiword or similar tool for .doc files
      const { stdout } = await execAsync(`antiword "${filePath}"`);
      return stdout;
    } catch (error) {
      throw new Error(`Failed to extract DOC text: ${error.message}`);
    }
  }

  private async extractDocxText(filePath: string): Promise<string> {
    try {
      // Use mammoth or similar library for .docx files
      // Simple approach using unzip and xml parsing
      const { stdout } = await execAsync(`unzip -p "${filePath}" word/document.xml | sed 's/<[^>]*>//g'`);
      return stdout;
    } catch (error) {
      throw new Error(`Failed to extract DOCX text: ${error.message}`);
    }
  }

  private async extractImageContent(filePath: string): Promise<string> {
    try {
      const imageBuffer = fs.readFileSync(filePath);
      const description = await groqService.analyzeImage(
        imageBuffer,
        "Describe this image in detail. Include any text, objects, people, scenes, and relevant context."
      );
      return description;
    } catch (error) {
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  private async extractAudioContent(filePath: string): Promise<string> {
    try {
      const transcription = await groqService.transcribeAudio(filePath);
      return transcription;
    } catch (error) {
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  async searchFiles(userId: string, query: string): Promise<File[]> {
    try {
      const files = await storage.getUserFiles(userId);
      
      if (!query.trim()) {
        return files;
      }

      // Simple text search in extracted content
      return files.filter(file => {
        if (!file.extractedText) return false;
        
        return file.extractedText.toLowerCase().includes(query.toLowerCase()) ||
               file.originalName.toLowerCase().includes(query.toLowerCase());
      });
    } catch (error) {
      console.error("Error searching files:", error);
      return [];
    }
  }

  async getFileContent(fileId: number, userId: string): Promise<string> {
    try {
      const file = await storage.getFile(fileId, userId);
      
      if (!file) {
        throw new Error("File not found");
      }

      if (!file.processed || !file.extractedText) {
        throw new Error("File not yet processed");
      }

      return file.extractedText;
    } catch (error) {
      console.error("Error getting file content:", error);
      throw error;
    }
  }
}

export const fileService = new FileService();

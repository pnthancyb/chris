# Analyze the code changes and generate the modified code file.
# The goal is to enhance PDF processing capabilities by adding pdf-parse library and improving the extractPdfText function.

import fs from 'fs';
import path from 'path';
import { promisify } from "util";
import { exec } from "child_process";
import { storage } from "../storage";
import { groqService } from "./groqService";
import type { File } from "@shared/schema";
import { spawn } from 'child_process';

// Import pdf-parse if available
let pdfParse: any = null;
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  console.log('pdf-parse not available, using fallback PDF processing');
}

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
      // Try using pdf-parse library first
      if (pdfParse) {
        try {
          const dataBuffer = fs.readFileSync(filePath);
          const data = await pdfParse(dataBuffer);

          if (data.text && data.text.trim()) {
            const fileName = path.basename(filePath);
            const stats = fs.statSync(filePath);

            return `PDF Document: ${fileName}
Pages: ${data.numpages}
File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB

Content:
${data.text.trim()}`;
          }
        } catch (parseError) {
          console.error('pdf-parse extraction failed:', parseError);
        }
      }

      // Try using pdftotext (part of poppler-utils) as fallback
      try {
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);

        const { stdout } = await execAsync(`pdftotext "${filePath}" -`);
        if (stdout && stdout.trim()) {
          const fileName = path.basename(filePath);
          return `PDF Document: ${fileName}

Content:
${stdout.trim()}`;
        }
      } catch (pdfError) {
        console.log('pdftotext not available');
      }

      // Enhanced fallback with file metadata
      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);

      return `PDF Document: ${fileName}
File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB
Created: ${stats.birthtime.toLocaleDateString()}
Modified: ${stats.mtime.toLocaleDateString()}

This PDF file has been uploaded and is available for processing. The content could not be extracted automatically, but the file can be downloaded and reviewed manually.

To enable full PDF text extraction, ensure that pdf-parse library is properly installed.`;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return `Error processing PDF file: ${path.basename(filePath)} - ${error}`;
    }
  }

  private async extractPDFTextFallback(filePath: string): Promise<string> {
    try {
      // Try using Python script for PDF extraction
      try {
        const { spawn } = require('child_process');
        const pythonScript = `
import sys
try:
    import PyPDF2
    with open('${filePath}', 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\\n"
        print(text.strip())
except ImportError:
    try:
        import pdfplumber
        with pdfplumber.open('${filePath}') as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or "" + "\\n"
            print(text.strip())
    except ImportError:
        print("PDF_EXTRACTION_FAILED")
except Exception as e:
    print(f"ERROR: {str(e)}")
`;

        return new Promise((resolve) => {
          const python = spawn('python3', ['-c', pythonScript]);
          let output = '';
          let error = '';

          python.stdout.on('data', (data) => {
            output += data.toString();
          });

          python.stderr.on('data', (data) => {
            error += data.toString();
          });

          python.on('close', () => {
            if (output.trim() && !output.includes('PDF_EXTRACTION_FAILED') && !output.startsWith('ERROR:')) {
              resolve(output.trim());
            } else {
              resolve(this.basicPDFExtraction(filePath));
            }
          });
        });
      } catch (pythonError) {
        return this.basicPDFExtraction(filePath);
      }
    } catch (error) {
      console.error('PDF extraction error:', error);
      return 'Error extracting PDF content. Please ensure the file is a valid PDF.';
    }
  }

  private basicPDFExtraction(filePath: string): string {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const pdfString = fileBuffer.toString('latin1');

      // Look for text patterns in PDF
      const textRegex = /\((.*?)\)\s*Tj/g;
      const texts: string[] = [];
      let match;

      while ((match = textRegex.exec(pdfString)) !== null) {
        const text = match[1].replace(/\\[0-9]{3}/g, ' ').trim();
        if (text && text.length > 1) {
          texts.push(text);
        }
      }

      if (texts.length === 0) {
        return 'PDF content could not be extracted. This might be a scanned PDF or image-based PDF that requires OCR.';
      }

      return texts.join(' ').replace(/\s+/g, ' ').trim();
    } catch (error) {
      return 'Error extracting PDF content. Please ensure the file is a valid PDF.';
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

  private async extractFileContent(file: File): Promise<string> {
    const filePath = file.path;

    if (file.mimeType?.startsWith('text/')) {
      return fs.readFileSync(filePath, 'utf-8');
    }

    if (file.mimeType === 'application/json') {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.stringify(JSON.parse(content), null, 2);
    }

    if (file.mimeType === 'application/pdf') {
      try {
        return await this.extractPDFText(filePath);
      } catch (error) {
        console.error('PDF extraction failed:', error);
        return `PDF file: ${file.originalName}\nSize: ${file.size} bytes\nNote: Text extraction failed. This might be a scanned PDF requiring OCR.`;
      }
    }

    // For other file types, return basic info
    return `File: ${file.originalName}\nType: ${file.mimeType}\nSize: ${file.size} bytes`;
  }
}

export const fileService = new FileService();
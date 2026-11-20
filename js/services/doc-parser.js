/* 2ndMBstudy — Document & Pasted Notes Parser */
/* Extracts usable text cleanly in-browser and chunks long study text safely. */

import { APP_CONFIG } from '../config/app-config.js';

function getLowerExtension(filename = '') {
  const idx = String(filename).lastIndexOf('.');
  return idx >= 0 ? String(filename).slice(idx).toLowerCase() : '';
}

function decodeXmlEntities(str = '') {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num) || 32));
}

async function extractTextFromDocx(file) {
  // Lightweight ZIP entry reader for word/document.xml using DecompressionStream when supported
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Locate End of Central Directory (EOCD) signature: 0x06054b50
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Could not read DOCX archive structure.');
  }

  const view = new DataView(buffer);
  const centralDirEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);

  let ptr = centralDirOffset;
  for (let i = 0; i < centralDirEntries; i += 1) {
    if (
      bytes[ptr] !== 0x50 ||
      bytes[ptr + 1] !== 0x4b ||
      bytes[ptr + 2] !== 0x01 ||
      bytes[ptr + 3] !== 0x02
    ) {
      break;
    }

    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const nameBytes = bytes.slice(ptr + 46, ptr + 46 + nameLen);
    const entryName = new TextDecoder().decode(nameBytes);

    if (entryName === 'word/document.xml') {
      const localNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compressedSlice = bytes.slice(dataStart, dataStart + compressedSize);

      let xmlBytes;
      if (compressionMethod === 0) {
        xmlBytes = compressedSlice;
      } else if (compressionMethod === 8 && typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(compressedSlice);
        writer.close();
        const decompressedBuf = await new Response(ds.readable).arrayBuffer();
        xmlBytes = new Uint8Array(decompressedBuf);
      } else {
        throw new Error('This browser does not support compressed DOCX decompression. Paste text or upload a .txt file.');
      }

      const xmlText = new TextDecoder().decode(xmlBytes);
      const withBreaks = xmlText
        .replace(/<\/w:p>/g, '\n')
        .replace(/<w:tab\/>/g, ' ')
        .replace(/<[^>]+>/g, ' ');
      return decodeXmlEntities(withBreaks)
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n+/g, '\n\n')
        .trim();
    }

    ptr += 46 + nameLen + extraLen + commentLen;
  }

  throw new Error('No readable text XML found inside this DOCX file.');
}

async function extractTextFromPdf(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const latin = new TextDecoder('latin1').decode(bytes);

  // Extract printable text literals inside PDF text objects where plain text streams exist
  const chunks = [];
  const parenRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
  let match;
  while ((match = parenRegex.exec(latin)) !== null) {
    const cleaned = match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/[^\x20-\x7E\n]/g, ' ')
      .trim();
    if (cleaned.length >= 2 && /[A-Za-z]/.test(cleaned)) {
      chunks.push(cleaned);
    }
    if (chunks.join(' ').length > APP_CONFIG.limits.maxExtractedChars * 1.4) {
      break;
    }
  }

  const combined = chunks.join(' ').replace(/\s{2,}/g, ' ').trim();
  if (!combined || combined.length < 30) {
    throw new Error(
      'This PDF appears to be a scanned image or uses compressed font streams without selectable text. Paste key lecture notes or upload a .txt / text-based file.'
    );
  }
  return combined;
}

export function chunkStudyText(text = '', chunkSize = APP_CONFIG.limits.chunkSizeChars) {
  const clean = String(text || '').trim();
  if (!clean) return [];
  const size = Math.max(500, Number(chunkSize) || APP_CONFIG.limits.chunkSizeChars);
  const chunks = [];
  let cursor = 0;

  while (cursor < clean.length) {
    let end = Math.min(clean.length, cursor + size);
    if (end < clean.length) {
      const lastBreak = clean.lastIndexOf('\n', end);
      const lastSpace = clean.lastIndexOf(' ', end);
      const splitAt = lastBreak > cursor + size * 0.5 ? lastBreak : lastSpace > cursor + size * 0.5 ? lastSpace : end;
      end = splitAt;
    }
    const part = clean.slice(cursor, end).trim();
    if (part) chunks.push(part);
    cursor = Math.max(end, cursor + 1);
  }

  return chunks;
}

export function normalizePastedNotes(rawText = '') {
  const clean = String(rawText || '').replace(/\r\n/g, '\n').trim();
  if (!clean) {
    throw new Error('Please paste study notes before parsing.');
  }
  const truncated = clean.length > APP_CONFIG.limits.maxPastedChars;
  const text = clean.slice(0, APP_CONFIG.limits.maxPastedChars);
  return {
    text,
    truncated,
    charCount: text.length,
    chunks: chunkStudyText(text)
  };
}

export async function parseUploadedStudyFile(file) {
  if (!file || typeof file !== 'object') {
    throw new Error('No file selected.');
  }

  if (file.size > APP_CONFIG.limits.maxFileBytes) {
    const maxMb = Math.round(APP_CONFIG.limits.maxFileBytes / (1024 * 1024));
    throw new Error(`File exceeds the ${maxMb} MB limit. Choose a smaller file or paste your notes directly.`);
  }

  const ext = getLowerExtension(file.name);
  const mime = String(file.type || '').toLowerCase();

  if (
    !APP_CONFIG.limits.allowedExtensions.includes(ext) &&
    !APP_CONFIG.limits.allowedMimeTypes.includes(mime)
  ) {
    throw new Error('Unsupported file type. Upload a .pdf, .docx, .txt, .jpg, .jpeg, or .png file.');
  }

  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || mime.startsWith('image/')) {
    throw new Error(
      'Image-only lecture slides/photos cannot be OCR-read locally without a vision pipeline. Paste the text from your notes or upload a .txt / .docx file.'
    );
  }

  let extracted = '';
  if (ext === '.txt' || mime === 'text/plain') {
    extracted = await file.text();
  } else if (ext === '.docx' || mime.includes('wordprocessingml.document')) {
    extracted = await extractTextFromDocx(file);
  } else if (ext === '.pdf' || mime === 'application/pdf') {
    extracted = await extractTextFromPdf(file);
  } else {
    extracted = await file.text();
  }

  const cleaned = String(extracted || '').replace(/\r\n/g, '\n').trim();
  if (!cleaned) {
    throw new Error('No readable text could be extracted from that file.');
  }

  const truncated = cleaned.length > APP_CONFIG.limits.maxExtractedChars;
  const text = cleaned.slice(0, APP_CONFIG.limits.maxExtractedChars);

  return {
    filename: file.name || 'uploaded-notes',
    text,
    truncated,
    charCount: text.length,
    chunks: chunkStudyText(text)
  };
}

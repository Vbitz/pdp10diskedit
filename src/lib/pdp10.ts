/**
 * PDP-10 / 36-bit word utilities for SIMH disk images
 *
 * SIMH stores 36-bit words as 64-bit (8-byte) values in little-endian format.
 * The 36-bit word occupies the low 36 bits, with high 28 bits typically zero.
 *
 * PDP-10 word format:
 * - Bits 0-8: opcode (9 bits)
 * - Bits 9-12: accumulator (4 bits)
 * - Bit 13: indirect bit
 * - Bits 14-17: index register (4 bits)
 * - Bits 18-35: address/immediate (18 bits)
 *
 * Common conventions:
 * - Left half: bits 0-17 (high 18 bits)
 * - Right half: bits 18-35 (low 18 bits)
 * - Halfword addresses are 18 bits
 */

export const BITS_PER_WORD = 36;
export const BYTES_PER_SIMH_WORD = 8; // 64-bit storage
export const WORDS_PER_SECTOR = 128;
export const BYTES_PER_SECTOR = WORDS_PER_SECTOR * BYTES_PER_SIMH_WORD; // 1024 bytes

// 36-bit mask
export const WORD_MASK = 0xFFFFFFFFFn; // 36 bits of 1s

// Halfword masks
export const LEFT_HALF_MASK = 0xFFFFFC0000n; // bits 0-17
export const RIGHT_HALF_MASK = 0x3FFFFn; // bits 18-35

/**
 * Represents a 36-bit PDP-10 word stored as a BigInt
 */
export type Word36 = bigint;

/**
 * Read a 36-bit word from a SIMH disk image buffer
 * SIMH stores 36-bit words as 64-bit little-endian values
 */
export function readWord(buffer: ArrayBuffer, byteOffset: number): Word36 {
  const view = new DataView(buffer);
  // Read as two 32-bit values (little-endian)
  const low = BigInt(view.getUint32(byteOffset, true));
  const high = BigInt(view.getUint32(byteOffset + 4, true));
  // Combine and mask to 36 bits
  return ((high << 32n) | low) & WORD_MASK;
}

/**
 * Write a 36-bit word to a buffer in SIMH format
 */
export function writeWord(buffer: ArrayBuffer, byteOffset: number, word: Word36): void {
  const view = new DataView(buffer);
  const masked = word & WORD_MASK;
  view.setUint32(byteOffset, Number(masked & 0xFFFFFFFFn), true);
  view.setUint32(byteOffset + 4, Number(masked >> 32n), true);
}

/**
 * Read multiple words from buffer
 */
export function readWords(buffer: ArrayBuffer, byteOffset: number, count: number): Word36[] {
  const words: Word36[] = [];
  for (let i = 0; i < count; i++) {
    words.push(readWord(buffer, byteOffset + i * BYTES_PER_SIMH_WORD));
  }
  return words;
}

/**
 * Get left half (bits 0-17) of a 36-bit word
 */
export function leftHalf(word: Word36): number {
  return Number((word >> 18n) & 0x3FFFFn);
}

/**
 * Get right half (bits 18-35) of a 36-bit word
 */
export function rightHalf(word: Word36): number {
  return Number(word & 0x3FFFFn);
}

/**
 * Combine two 18-bit halfwords into a 36-bit word
 */
export function makeWord(left: number, right: number): Word36 {
  return ((BigInt(left & 0x3FFFF) << 18n) | BigInt(right & 0x3FFFF));
}

/**
 * Format a 36-bit word as octal (PDP-10 native format)
 * Returns 12 octal digits (6 left half, 6 right half)
 */
export function formatOctal(word: Word36): string {
  const left = leftHalf(word);
  const right = rightHalf(word);
  return left.toString(8).padStart(6, '0') + ',' + right.toString(8).padStart(6, '0');
}

/**
 * Format a 36-bit word as full octal without comma
 */
export function formatOctalFull(word: Word36): string {
  return word.toString(8).padStart(12, '0');
}

/**
 * Format as hexadecimal (9 hex digits for 36 bits)
 */
export function formatHex(word: Word36): string {
  return word.toString(16).toUpperCase().padStart(9, '0');
}

/**
 * Format as binary (36 bits)
 */
export function formatBinary(word: Word36): string {
  return word.toString(2).padStart(36, '0');
}

/**
 * Parse octal string to word (handles comma-separated halfwords)
 */
export function parseOctal(str: string): Word36 {
  const cleaned = str.replace(/\s/g, '');
  if (cleaned.includes(',')) {
    const [left, right] = cleaned.split(',');
    return makeWord(parseInt(left, 8), parseInt(right, 8));
  }
  return BigInt('0o' + cleaned) & WORD_MASK;
}

/**
 * Parse hex string to word
 */
export function parseHex(str: string): Word36 {
  return BigInt('0x' + str.replace(/\s/g, '')) & WORD_MASK;
}

/**
 * Convert 36-bit word to SIXBIT characters (6 chars, 6 bits each)
 * SIXBIT encoding: add 040 (space) to get ASCII
 */
export function toSixbit(word: Word36): string {
  let result = '';
  for (let i = 0; i < 6; i++) {
    const shift = BigInt((5 - i) * 6);
    const char = Number((word >> shift) & 0x3Fn);
    result += String.fromCharCode(char + 0o40);
  }
  return result;
}

/**
 * Convert string to SIXBIT word (up to 6 chars)
 */
export function fromSixbit(str: string): Word36 {
  let word = 0n;
  for (let i = 0; i < Math.min(6, str.length); i++) {
    const char = str.charCodeAt(i) - 0o40;
    const shift = BigInt((5 - i) * 6);
    word |= BigInt(char & 0x3F) << shift;
  }
  return word;
}

/**
 * Convert 36-bit word to ASCII-7 characters (5 chars, 7 bits each, 1 bit unused)
 */
export function toAscii7(word: Word36): string {
  let result = '';
  for (let i = 0; i < 5; i++) {
    const shift = BigInt(29 - i * 7);
    const char = Number((word >> shift) & 0x7Fn);
    if (char >= 32 && char < 127) {
      result += String.fromCharCode(char);
    } else {
      result += '.';
    }
  }
  return result;
}

/**
 * Convert 36-bit word to ASCIZ bytes (for display)
 * Shows printable chars or dots
 */
export function toDisplayAscii(word: Word36): string {
  const bytes = [
    Number((word >> 28n) & 0xFFn),
    Number((word >> 20n) & 0xFFn),
    Number((word >> 12n) & 0xFFn),
    Number((word >> 4n) & 0xFFn),
  ];
  return bytes.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
}

/**
 * Disk geometry for common PDP-10 disk types
 */
export interface DiskGeometry {
  name: string;
  cylinders: number;
  heads: number;
  sectorsPerTrack: number;
  wordsPerSector: number;
  totalSectors: number;
  totalBytes: number;
}

export const DISK_TYPES: Record<string, DiskGeometry> = {
  'RP04': {
    name: 'RP04',
    cylinders: 411,
    heads: 19,
    sectorsPerTrack: 20,
    wordsPerSector: 128,
    get totalSectors() { return this.cylinders * this.heads * this.sectorsPerTrack; },
    get totalBytes() { return this.totalSectors * this.wordsPerSector * BYTES_PER_SIMH_WORD; },
  },
  'RP06': {
    name: 'RP06',
    cylinders: 815,
    heads: 19,
    sectorsPerTrack: 20,
    wordsPerSector: 128,
    get totalSectors() { return this.cylinders * this.heads * this.sectorsPerTrack; },
    get totalBytes() { return this.totalSectors * this.wordsPerSector * BYTES_PER_SIMH_WORD; },
  },
  'RP07': {
    name: 'RP07',
    cylinders: 630,
    heads: 32,
    sectorsPerTrack: 43,
    wordsPerSector: 128,
    get totalSectors() { return this.cylinders * this.heads * this.sectorsPerTrack; },
    get totalBytes() { return this.totalSectors * this.wordsPerSector * BYTES_PER_SIMH_WORD; },
  },
  'RM03': {
    name: 'RM03',
    cylinders: 823,
    heads: 5,
    sectorsPerTrack: 32,
    wordsPerSector: 128,
    get totalSectors() { return this.cylinders * this.heads * this.sectorsPerTrack; },
    get totalBytes() { return this.totalSectors * this.wordsPerSector * BYTES_PER_SIMH_WORD; },
  },
  'RM80': {
    name: 'RM80',
    cylinders: 559,
    heads: 14,
    sectorsPerTrack: 31,
    wordsPerSector: 128,
    get totalSectors() { return this.cylinders * this.heads * this.sectorsPerTrack; },
    get totalBytes() { return this.totalSectors * this.wordsPerSector * BYTES_PER_SIMH_WORD; },
  },
};

/**
 * Try to detect disk type from file size
 */
export function detectDiskType(fileSize: number): DiskGeometry | null {
  for (const [, geometry] of Object.entries(DISK_TYPES)) {
    // Allow some tolerance for slight size variations
    if (Math.abs(fileSize - geometry.totalBytes) < BYTES_PER_SECTOR * 100) {
      return geometry;
    }
  }
  return null;
}

/**
 * Convert sector number to CHS (Cylinder, Head, Sector)
 */
export function sectorToCHS(sector: number, geometry: DiskGeometry): { cylinder: number; head: number; sector: number } {
  const sectorsPerCylinder = geometry.heads * geometry.sectorsPerTrack;
  const cylinder = Math.floor(sector / sectorsPerCylinder);
  const remaining = sector % sectorsPerCylinder;
  const head = Math.floor(remaining / geometry.sectorsPerTrack);
  const sectorInTrack = remaining % geometry.sectorsPerTrack;
  return { cylinder, head, sector: sectorInTrack };
}

/**
 * Convert CHS to sector number
 */
export function chsToSector(cylinder: number, head: number, sector: number, geometry: DiskGeometry): number {
  return (cylinder * geometry.heads + head) * geometry.sectorsPerTrack + sector;
}

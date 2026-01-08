/**
 * Disk image management for SIMH PDP-10 disk files
 */

import {
  Word36,
  readWord,
  writeWord,
  BYTES_PER_SIMH_WORD,
  WORDS_PER_SECTOR,
  BYTES_PER_SECTOR,
  DiskGeometry,
  detectDiskType,
  DISK_TYPES,
} from './pdp10';

export interface DiskImage {
  name: string;
  buffer: ArrayBuffer;
  geometry: DiskGeometry | null;
  modified: boolean;
}

/**
 * Load a disk image from a File object
 */
export async function loadDiskImage(file: File): Promise<DiskImage> {
  const buffer = await file.arrayBuffer();
  const geometry = detectDiskType(buffer.byteLength);

  return {
    name: file.name,
    buffer,
    geometry,
    modified: false,
  };
}

/**
 * Create an empty disk image
 */
export function createEmptyDisk(type: keyof typeof DISK_TYPES): DiskImage {
  const geometry = DISK_TYPES[type];
  const buffer = new ArrayBuffer(geometry.totalBytes);

  return {
    name: `new_${type.toLowerCase()}.dsk`,
    buffer,
    geometry,
    modified: true,
  };
}

/**
 * Get total number of words in disk
 */
export function getTotalWords(disk: DiskImage): number {
  return Math.floor(disk.buffer.byteLength / BYTES_PER_SIMH_WORD);
}

/**
 * Get total number of sectors
 */
export function getTotalSectors(disk: DiskImage): number {
  return Math.floor(disk.buffer.byteLength / BYTES_PER_SECTOR);
}

/**
 * Read a word at a given word offset
 */
export function getWord(disk: DiskImage, wordOffset: number): Word36 {
  const byteOffset = wordOffset * BYTES_PER_SIMH_WORD;
  if (byteOffset + BYTES_PER_SIMH_WORD > disk.buffer.byteLength) {
    throw new Error(`Word offset ${wordOffset} is out of bounds`);
  }
  return readWord(disk.buffer, byteOffset);
}

/**
 * Write a word at a given word offset
 */
export function setWord(disk: DiskImage, wordOffset: number, value: Word36): void {
  const byteOffset = wordOffset * BYTES_PER_SIMH_WORD;
  if (byteOffset + BYTES_PER_SIMH_WORD > disk.buffer.byteLength) {
    throw new Error(`Word offset ${wordOffset} is out of bounds`);
  }
  writeWord(disk.buffer, byteOffset, value);
  disk.modified = true;
}

/**
 * Read a sector (128 words)
 */
export function getSector(disk: DiskImage, sectorNumber: number): Word36[] {
  const startWord = sectorNumber * WORDS_PER_SECTOR;
  const words: Word36[] = [];

  for (let i = 0; i < WORDS_PER_SECTOR; i++) {
    words.push(getWord(disk, startWord + i));
  }

  return words;
}

/**
 * Write a sector
 */
export function setSector(disk: DiskImage, sectorNumber: number, words: Word36[]): void {
  if (words.length !== WORDS_PER_SECTOR) {
    throw new Error(`Sector must contain exactly ${WORDS_PER_SECTOR} words`);
  }

  const startWord = sectorNumber * WORDS_PER_SECTOR;

  for (let i = 0; i < WORDS_PER_SECTOR; i++) {
    setWord(disk, startWord + i, words[i]);
  }
}

/**
 * Get a range of words
 */
export function getWords(disk: DiskImage, startWord: number, count: number): Word36[] {
  const words: Word36[] = [];
  const maxWords = getTotalWords(disk);

  for (let i = 0; i < count && startWord + i < maxWords; i++) {
    words.push(getWord(disk, startWord + i));
  }

  return words;
}

/**
 * Search for a pattern in the disk (octal or hex string)
 */
export function searchWords(
  disk: DiskImage,
  pattern: Word36[],
  startOffset: number = 0
): number {
  const totalWords = getTotalWords(disk);

  for (let i = startOffset; i <= totalWords - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (getWord(disk, i + j) !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      return i;
    }
  }

  return -1;
}

/**
 * Export disk image as downloadable file
 */
export function downloadDisk(disk: DiskImage): void {
  const blob = new Blob([disk.buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = disk.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

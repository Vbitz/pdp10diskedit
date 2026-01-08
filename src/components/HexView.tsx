import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Word36,
  formatOctal,
  formatHex,
  formatOctalFull,
  toSixbit,
  toAscii7,
  parseOctal,
  parseHex,
  WORD_MASK,
} from '../lib/pdp10';
import { DiskImage, getWords, setWord, getTotalWords } from '../lib/diskImage';

export type DisplayMode = 'octal' | 'octal-full' | 'hex' | 'sixbit' | 'ascii7';

interface HexViewProps {
  disk: DiskImage;
  startWord: number;
  onStartWordChange: (word: number) => void;
  displayMode: DisplayMode;
  onDiskModified: () => void;
  selectedWord: number | null;
  onSelectWord: (word: number | null) => void;
}

const WORDS_PER_ROW = 8;
const ROW_HEIGHT = 24; // pixels per row
const HEADER_FOOTER_HEIGHT = 80; // approximate header + footer + padding

/**
 * Convert a 36-bit word to printable ASCII representation
 * Extracts 4 bytes (using 8-bit chunks from the 36 bits) and shows printable chars
 */
function wordToAscii(word: Word36): string {
  // Extract 5 7-bit ASCII characters (common PDP-10 packing)
  const chars: string[] = [];
  for (let i = 0; i < 5; i++) {
    const shift = BigInt(29 - i * 7);
    const byte = Number((word >> shift) & 0x7Fn);
    chars.push(byte >= 32 && byte < 127 ? String.fromCharCode(byte) : '.');
  }
  return chars.join('');
}

export default function HexView({
  disk,
  startWord,
  onStartWordChange,
  displayMode,
  onDiskModified,
  selectedWord,
  onSelectWord,
}: HexViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rowCount, setRowCount] = useState(16);
  const [editingWord, setEditingWord] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // Calculate rows based on container height
  useEffect(() => {
    const updateRowCount = () => {
      if (containerRef.current) {
        const availableHeight = containerRef.current.clientHeight - HEADER_FOOTER_HEIGHT;
        const rows = Math.max(4, Math.floor(availableHeight / ROW_HEIGHT));
        setRowCount(rows);
      }
    };

    updateRowCount();

    const resizeObserver = new ResizeObserver(updateRowCount);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const wordsPerPage = WORDS_PER_ROW * rowCount;
  const totalWords = getTotalWords(disk);

  const words = useMemo(
    () => getWords(disk, startWord, wordsPerPage),
    [disk, startWord, wordsPerPage, disk.modified]
  );

  const formatWord = useCallback(
    (word: Word36): string => {
      switch (displayMode) {
        case 'octal':
          return formatOctal(word);
        case 'octal-full':
          return formatOctalFull(word);
        case 'hex':
          return formatHex(word);
        case 'sixbit':
          return toSixbit(word);
        case 'ascii7':
          return toAscii7(word);
        default:
          return formatOctal(word);
      }
    },
    [displayMode]
  );

  const handleWordClick = (wordIndex: number) => {
    const absoluteWord = startWord + wordIndex;
    onSelectWord(absoluteWord);
  };

  const handleWordDoubleClick = (wordIndex: number) => {
    const absoluteWord = startWord + wordIndex;
    setEditingWord(absoluteWord);
    setEditValue(formatWord(words[wordIndex]));
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, wordIndex: number) => {
    if (e.key === 'Enter') {
      try {
        let newValue: Word36;
        if (displayMode === 'hex') {
          newValue = parseHex(editValue);
        } else {
          newValue = parseOctal(editValue.replace(',', ''));
        }
        newValue = newValue & WORD_MASK;
        setWord(disk, startWord + wordIndex, newValue);
        onDiskModified();
      } catch {
        // Invalid input, ignore
      }
      setEditingWord(null);
    } else if (e.key === 'Escape') {
      setEditingWord(null);
    }
  };

  const handleScroll = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? WORDS_PER_ROW : -WORDS_PER_ROW;
    const newStart = Math.max(0, Math.min(startWord + delta, totalWords - wordsPerPage));
    onStartWordChange(newStart);
  };

  const rows = useMemo(() => {
    const result = [];
    for (let row = 0; row < rowCount; row++) {
      const rowWords = words.slice(row * WORDS_PER_ROW, (row + 1) * WORDS_PER_ROW);
      const rowStartWord = startWord + row * WORDS_PER_ROW;
      if (rowWords.length > 0) {
        result.push({ rowStartWord, words: rowWords, rowIndex: row });
      }
    }
    return result;
  }, [words, startWord, rowCount]);

  // Get column width class based on display mode
  const getColumnWidth = () => {
    switch (displayMode) {
      case 'octal':
        return 'w-[110px]'; // "000000,000000"
      case 'octal-full':
        return 'w-[100px]'; // "000000000000"
      case 'hex':
        return 'w-[80px]'; // "000000000"
      case 'sixbit':
      case 'ascii7':
        return 'w-[60px]'; // 5-6 chars
      default:
        return 'w-[110px]';
    }
  };

  return (
    <div
      ref={containerRef}
      className="hex-view font-mono text-sm bg-gray-800 rounded-lg p-4 h-full flex flex-col"
      onWheel={handleScroll}
    >
      {/* Header */}
      <div className="flex text-gray-400 border-b border-gray-700 pb-2 mb-2 shrink-0">
        <div className="w-24 shrink-0">Offset</div>
        <div className="flex-1 flex">
          {Array.from({ length: WORDS_PER_ROW }, (_, i) => (
            <div key={i} className={`${getColumnWidth()} text-center shrink-0`}>
              +{i}
            </div>
          ))}
        </div>
        <div className="w-44 ml-4 text-center shrink-0">ASCII</div>
      </div>

      {/* Data rows - flexible height */}
      <div className="flex-1 overflow-hidden">
        {rows.map(({ rowStartWord, words: rowWords, rowIndex }) => (
          <div key={rowIndex} className="flex hover:bg-gray-700/30 leading-6">
            <div className="w-24 shrink-0 text-amber-500">
              {rowStartWord.toString(8).padStart(8, '0')}
            </div>
            <div className="flex-1 flex">
              {rowWords.map((word, i) => {
                const absoluteWord = rowStartWord + i;
                const isSelected = selectedWord === absoluteWord;
                const isEditing = editingWord === absoluteWord;
                const wordIndex = rowIndex * WORDS_PER_ROW + i;

                return (
                  <div
                    key={i}
                    className={`${getColumnWidth()} text-center cursor-pointer px-1 rounded shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700'
                    }`}
                    onClick={() => handleWordClick(wordIndex)}
                    onDoubleClick={() => handleWordDoubleClick(wordIndex)}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, wordIndex)}
                        onBlur={() => setEditingWord(null)}
                        className="w-full bg-gray-900 text-green-400 text-center outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className={word === 0n ? 'text-gray-600' : 'text-green-400'}>
                        {formatWord(word)}
                      </span>
                    )}
                  </div>
                );
              })}
              {/* Pad empty cells if row is incomplete */}
              {Array.from({ length: WORDS_PER_ROW - rowWords.length }, (_, i) => (
                <div key={`empty-${i}`} className={`${getColumnWidth()} shrink-0`} />
              ))}
            </div>
            {/* ASCII column - always visible */}
            <div className="w-44 ml-4 text-cyan-400 shrink-0 border-l border-gray-700 pl-2">
              {rowWords.map((w) => wordToAscii(w)).join('')}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation info */}
      <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400 text-xs flex justify-between shrink-0">
        <span>
          Words {startWord.toLocaleString()} - {Math.min(startWord + wordsPerPage, totalWords).toLocaleString()} of {totalWords.toLocaleString()}
        </span>
        <span>Scroll to navigate | Double-click to edit</span>
      </div>
    </div>
  );
}

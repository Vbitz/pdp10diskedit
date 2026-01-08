import { useState, useCallback, useMemo } from 'react';
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
const ROWS_PER_PAGE = 16;
const WORDS_PER_PAGE = WORDS_PER_ROW * ROWS_PER_PAGE;

export default function HexView({
  disk,
  startWord,
  onStartWordChange,
  displayMode,
  onDiskModified,
  selectedWord,
  onSelectWord,
}: HexViewProps) {
  const [editingWord, setEditingWord] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const totalWords = getTotalWords(disk);
  const words = useMemo(
    () => getWords(disk, startWord, WORDS_PER_PAGE),
    [disk, startWord, disk.modified]
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
    const newStart = Math.max(0, Math.min(startWord + delta, totalWords - WORDS_PER_PAGE));
    onStartWordChange(newStart);
  };

  const rows = useMemo(() => {
    const result = [];
    for (let row = 0; row < ROWS_PER_PAGE; row++) {
      const rowWords = words.slice(row * WORDS_PER_ROW, (row + 1) * WORDS_PER_ROW);
      const rowStartWord = startWord + row * WORDS_PER_ROW;
      result.push({ rowStartWord, words: rowWords, rowIndex: row });
    }
    return result;
  }, [words, startWord]);

  return (
    <div
      className="hex-view font-mono text-sm overflow-auto bg-gray-800 rounded-lg p-4"
      onWheel={handleScroll}
    >
      {/* Header */}
      <div className="flex text-gray-400 border-b border-gray-700 pb-2 mb-2">
        <div className="w-24 shrink-0">Offset</div>
        {Array.from({ length: WORDS_PER_ROW }, (_, i) => (
          <div key={i} className="flex-1 text-center">
            +{i}
          </div>
        ))}
        {(displayMode === 'sixbit' || displayMode === 'ascii7') && (
          <div className="w-32 ml-4">Text</div>
        )}
      </div>

      {/* Data rows */}
      {rows.map(({ rowStartWord, words: rowWords, rowIndex }) => (
        <div key={rowIndex} className="flex hover:bg-gray-750 py-0.5">
          <div className="w-24 shrink-0 text-amber-500">
            {rowStartWord.toString(8).padStart(8, '0')}
          </div>
          {rowWords.map((word, i) => {
            const absoluteWord = rowStartWord + i;
            const isSelected = selectedWord === absoluteWord;
            const isEditing = editingWord === absoluteWord;
            const wordIndex = rowIndex * WORDS_PER_ROW + i;

            return (
              <div
                key={i}
                className={`flex-1 text-center cursor-pointer px-1 rounded ${
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
          {(displayMode === 'sixbit' || displayMode === 'ascii7') && (
            <div className="w-32 ml-4 text-cyan-400">
              {rowWords
                .map((w) => (displayMode === 'sixbit' ? toSixbit(w) : toAscii7(w)))
                .join('')}
            </div>
          )}
        </div>
      ))}

      {/* Navigation info */}
      <div className="mt-4 pt-2 border-t border-gray-700 text-gray-400 text-xs flex justify-between">
        <span>
          Words {startWord.toLocaleString()} - {Math.min(startWord + WORDS_PER_PAGE, totalWords).toLocaleString()} of {totalWords.toLocaleString()}
        </span>
        <span>Scroll to navigate | Double-click to edit</span>
      </div>
    </div>
  );
}

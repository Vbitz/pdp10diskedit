import { useRef } from 'react';
import { DisplayMode } from './HexView';
import { DiskImage, downloadDisk } from '../lib/diskImage';
import { DISK_TYPES } from '../lib/pdp10';

interface ToolbarProps {
  disk: DiskImage | null;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onLoadDisk: (file: File) => void;
  onCreateDisk: (type: keyof typeof DISK_TYPES) => void;
  onGotoWord: (word: number) => void;
  onGotoSector: (sector: number) => void;
}

export default function Toolbar({
  disk,
  displayMode,
  onDisplayModeChange,
  onLoadDisk,
  onCreateDisk,
  onGotoWord,
  onGotoSector,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gotoWordRef = useRef<HTMLInputElement>(null);
  const gotoSectorRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadDisk(file);
    }
  };

  const handleGotoWord = () => {
    const value = gotoWordRef.current?.value;
    if (value) {
      // Parse as octal if starts with 0, otherwise decimal
      const word = value.startsWith('0o') || value.startsWith('0')
        ? parseInt(value.replace('0o', ''), 8)
        : parseInt(value, 10);
      if (!isNaN(word)) {
        onGotoWord(word);
      }
    }
  };

  const handleGotoSector = () => {
    const value = gotoSectorRef.current?.value;
    if (value) {
      const sector = parseInt(value, 10);
      if (!isNaN(sector)) {
        onGotoSector(sector);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-wrap gap-4 items-center">
      {/* File operations */}
      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".dsk,.img,.bin,*"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
        >
          Open Disk
        </button>
        <div className="relative group">
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors">
            New Disk
          </button>
          <div className="absolute hidden group-hover:block top-full left-0 mt-1 bg-gray-700 rounded shadow-lg z-10">
            {Object.keys(DISK_TYPES).map((type) => (
              <button
                key={type}
                onClick={() => onCreateDisk(type as keyof typeof DISK_TYPES)}
                className="block w-full px-4 py-2 text-left hover:bg-gray-600 first:rounded-t last:rounded-b"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        {disk && (
          <button
            onClick={() => downloadDisk(disk)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-medium transition-colors"
          >
            Save Disk
          </button>
        )}
      </div>

      {/* Display mode */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Display:</span>
        <select
          value={displayMode}
          onChange={(e) => onDisplayModeChange(e.target.value as DisplayMode)}
          className="bg-gray-700 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 outline-none"
        >
          <option value="octal">Octal (LH,RH)</option>
          <option value="octal-full">Octal (Full)</option>
          <option value="hex">Hexadecimal</option>
          <option value="sixbit">SIXBIT</option>
          <option value="ascii7">ASCII-7</option>
        </select>
      </div>

      {/* Navigation */}
      {disk && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Go to word:</span>
            <input
              ref={gotoWordRef}
              type="text"
              placeholder="0o... or decimal"
              className="bg-gray-700 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 outline-none w-32"
              onKeyDown={(e) => handleKeyDown(e, handleGotoWord)}
            />
            <button
              onClick={handleGotoWord}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            >
              Go
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Go to sector:</span>
            <input
              ref={gotoSectorRef}
              type="text"
              placeholder="sector #"
              className="bg-gray-700 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 outline-none w-24"
              onKeyDown={(e) => handleKeyDown(e, handleGotoSector)}
            />
            <button
              onClick={handleGotoSector}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            >
              Go
            </button>
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import HexView, { DisplayMode } from './components/HexView';
import DiskInfo from './components/DiskInfo';
import WordDetails from './components/WordDetails';
import { DiskImage, loadDiskImage, createEmptyDisk, getWord } from './lib/diskImage';
import { DISK_TYPES, WORDS_PER_SECTOR } from './lib/pdp10';

function App() {
  const [disk, setDisk] = useState<DiskImage | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('octal');
  const [startWord, setStartWord] = useState(0);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [, setModifiedCounter] = useState(0);

  const handleLoadDisk = useCallback(async (file: File) => {
    try {
      const loadedDisk = await loadDiskImage(file);
      setDisk(loadedDisk);
      setStartWord(0);
      setSelectedWord(null);
    } catch (error) {
      console.error('Failed to load disk:', error);
      alert('Failed to load disk image');
    }
  }, []);

  const handleCreateDisk = useCallback((type: keyof typeof DISK_TYPES) => {
    const newDisk = createEmptyDisk(type);
    setDisk(newDisk);
    setStartWord(0);
    setSelectedWord(null);
  }, []);

  const handleDiskModified = useCallback(() => {
    setModifiedCounter((c) => c + 1);
  }, []);

  const handleGotoWord = useCallback((word: number) => {
    setStartWord(Math.max(0, word));
    setSelectedWord(word);
  }, []);

  const handleGotoSector = useCallback((sector: number) => {
    const word = sector * WORDS_PER_SECTOR;
    setStartWord(word);
    setSelectedWord(word);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-amber-400">PDP-10 Disk Editor</h1>
        <p className="text-gray-400 mt-1">
          36-bit word editor for SIMH disk images
        </p>
      </header>

      <Toolbar
        disk={disk}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        onLoadDisk={handleLoadDisk}
        onCreateDisk={handleCreateDisk}
        onGotoWord={handleGotoWord}
        onGotoSector={handleGotoSector}
      />

      {disk ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <HexView
              disk={disk}
              startWord={startWord}
              onStartWordChange={setStartWord}
              displayMode={displayMode}
              onDiskModified={handleDiskModified}
              selectedWord={selectedWord}
              onSelectWord={setSelectedWord}
            />
          </div>
          <div className="space-y-6">
            <DiskInfo disk={disk} currentWord={startWord} />
            {selectedWord !== null && (
              <WordDetails
                word={getWord(disk, selectedWord)}
                wordOffset={selectedWord}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-12 text-center">
          <div className="inline-block bg-gray-800 rounded-lg p-8">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-300 mb-2">
              No Disk Image Loaded
            </h2>
            <p className="text-gray-500 mb-4">
              Open a SIMH disk image or create a new one to get started
            </p>
            <div className="text-left text-sm text-gray-400 mt-6">
              <p className="font-semibold mb-2">Supported formats:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>SIMH PDP-10 disk images (.dsk)</li>
                <li>RP04, RP06, RP07 pack images</li>
                <li>RM03, RM80 disk images</li>
              </ul>
              <p className="mt-4 text-gray-500">
                SIMH stores 36-bit words as 64-bit values (8 bytes each),
                with 128 words per sector.
              </p>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>
          PDP-10 Disk Editor | 36-bit word viewer for SIMH disk images
        </p>
        <p className="mt-1">
          References:{' '}
          <a
            href="https://simh.trailing-edge.com/pdp10.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            SIMH PDP-10
          </a>
          {' | '}
          <a
            href="http://bitsavers.org/pdf/dec/pdp10/TOPS10/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            TOPS-10 Documentation
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;

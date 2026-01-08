import { DiskImage, getTotalWords, getTotalSectors } from '../lib/diskImage';
import { BYTES_PER_SIMH_WORD, sectorToCHS, WORDS_PER_SECTOR } from '../lib/pdp10';

interface DiskInfoProps {
  disk: DiskImage;
  currentWord: number;
}

export default function DiskInfo({ disk, currentWord }: DiskInfoProps) {
  const totalWords = getTotalWords(disk);
  const totalSectors = getTotalSectors(disk);
  const currentSector = Math.floor(currentWord / WORDS_PER_SECTOR);
  const wordInSector = currentWord % WORDS_PER_SECTOR;

  const chs = disk.geometry ? sectorToCHS(currentSector, disk.geometry) : null;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-amber-400">Disk Information</h2>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="text-gray-400">File:</div>
        <div className="font-mono truncate" title={disk.name}>{disk.name}</div>

        <div className="text-gray-400">Size:</div>
        <div className="font-mono">
          {(disk.buffer.byteLength / (1024 * 1024)).toFixed(2)} MB
        </div>

        <div className="text-gray-400">Type:</div>
        <div className="font-mono">{disk.geometry?.name || 'Unknown'}</div>

        <div className="text-gray-400">Total Words:</div>
        <div className="font-mono">{totalWords.toLocaleString()}</div>

        <div className="text-gray-400">Total Sectors:</div>
        <div className="font-mono">{totalSectors.toLocaleString()}</div>

        <div className="text-gray-400">Modified:</div>
        <div className={disk.modified ? 'text-yellow-400' : 'text-green-400'}>
          {disk.modified ? 'Yes' : 'No'}
        </div>
      </div>

      {disk.geometry && (
        <>
          <h3 className="text-md font-semibold mt-4 mb-2 text-amber-400">Geometry</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-gray-400">Cylinders:</div>
            <div className="font-mono">{disk.geometry.cylinders}</div>

            <div className="text-gray-400">Heads:</div>
            <div className="font-mono">{disk.geometry.heads}</div>

            <div className="text-gray-400">Sectors/Track:</div>
            <div className="font-mono">{disk.geometry.sectorsPerTrack}</div>

            <div className="text-gray-400">Words/Sector:</div>
            <div className="font-mono">{disk.geometry.wordsPerSector}</div>
          </div>
        </>
      )}

      <h3 className="text-md font-semibold mt-4 mb-2 text-amber-400">Current Position</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="text-gray-400">Word Offset:</div>
        <div className="font-mono">{currentWord.toLocaleString()} (0o{currentWord.toString(8)})</div>

        <div className="text-gray-400">Byte Offset:</div>
        <div className="font-mono">0x{(currentWord * BYTES_PER_SIMH_WORD).toString(16).toUpperCase()}</div>

        <div className="text-gray-400">Sector:</div>
        <div className="font-mono">{currentSector}</div>

        <div className="text-gray-400">Word in Sector:</div>
        <div className="font-mono">{wordInSector}</div>

        {chs && (
          <>
            <div className="text-gray-400">C/H/S:</div>
            <div className="font-mono">
              {chs.cylinder}/{chs.head}/{chs.sector}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

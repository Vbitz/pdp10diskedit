import {
  Word36,
  formatOctal,
  formatOctalFull,
  formatHex,
  formatBinary,
  leftHalf,
  rightHalf,
  toSixbit,
  toAscii7,
} from '../lib/pdp10';

interface WordDetailsProps {
  word: Word36;
  wordOffset: number;
}

export default function WordDetails({ word, wordOffset }: WordDetailsProps) {
  const lh = leftHalf(word);
  const rh = rightHalf(word);

  // PDP-10 instruction decode (basic)
  const opcode = (lh >> 9) & 0x1FF;
  const ac = (lh >> 5) & 0xF;
  const indirect = (lh >> 4) & 0x1;
  const index = lh & 0xF;
  const address = rh;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-amber-400">Word Details</h2>

      <div className="text-sm mb-4">
        <div className="text-gray-400 mb-1">Word {wordOffset.toLocaleString()} (0o{wordOffset.toString(8)})</div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-gray-400 text-xs mb-1">Octal (LH,RH)</div>
          <div className="font-mono text-green-400 text-lg">{formatOctal(word)}</div>
        </div>

        <div>
          <div className="text-gray-400 text-xs mb-1">Octal (Full)</div>
          <div className="font-mono text-green-400">{formatOctalFull(word)}</div>
        </div>

        <div>
          <div className="text-gray-400 text-xs mb-1">Hexadecimal</div>
          <div className="font-mono text-blue-400">{formatHex(word)}</div>
        </div>

        <div>
          <div className="text-gray-400 text-xs mb-1">Binary</div>
          <div className="font-mono text-purple-400 text-xs break-all">
            {formatBinary(word).replace(/(.{6})/g, '$1 ')}
          </div>
        </div>

        <div>
          <div className="text-gray-400 text-xs mb-1">Decimal</div>
          <div className="font-mono text-yellow-400">{word.toString()}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-gray-400 text-xs mb-1">Left Half</div>
            <div className="font-mono text-cyan-400">
              {lh.toString(8).padStart(6, '0')} ({lh})
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Right Half</div>
            <div className="font-mono text-cyan-400">
              {rh.toString(8).padStart(6, '0')} ({rh})
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-gray-400 text-xs mb-1">SIXBIT</div>
            <div className="font-mono text-pink-400">{toSixbit(word)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">ASCII-7</div>
            <div className="font-mono text-pink-400">{toAscii7(word)}</div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="text-gray-400 text-xs mb-2">Instruction Decode</div>
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
            <div>
              <span className="text-gray-500">OP:</span>{' '}
              <span className="text-orange-400">{opcode.toString(8).padStart(3, '0')}</span>
            </div>
            <div>
              <span className="text-gray-500">AC:</span>{' '}
              <span className="text-orange-400">{ac}</span>
            </div>
            <div>
              <span className="text-gray-500">I:</span>{' '}
              <span className="text-orange-400">{indirect}</span>
            </div>
            <div>
              <span className="text-gray-500">X:</span>{' '}
              <span className="text-orange-400">{index}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">E:</span>{' '}
              <span className="text-orange-400">{address.toString(8).padStart(6, '0')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

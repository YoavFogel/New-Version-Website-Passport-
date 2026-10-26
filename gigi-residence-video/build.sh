#!/usr/bin/env bash
# Full build: music → 4K frames → mux.  Usage: ./build.sh [outDir] [scale=2]
set -euo pipefail
cd "$(dirname "$0")"
OUT=${1:-out}; SCALE=${2:-2}
mkdir -p "$OUT"
python3 music.py "$OUT/music.wav"
# voiceover untouched; music ducked under it (sidechain), whole mix normalised to -16 LUFS
ffmpeg -v error -y -i assets/voiceover.mp3 -i "$OUT/music.wav" -filter_complex \
 "[0:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=102,asplit=2[vo][sc];\
  [1:a]volume=0.15[mu];[mu][sc]sidechaincompress=threshold=0.015:ratio=10:attack=30:release=600:makeup=1[duck];\
  [vo][duck]amix=inputs=2:normalize=0:duration=longest,atrim=0:102,loudnorm=I=-16:TP=-1.5:LRA=11[out]" \
 -map "[out]" -ar 48000 "$OUT/mix.wav"
MB=${MB:-3} node render.cjs "$OUT/frames" "$SCALE" 4 25
ffmpeg -v error -y -f concat -safe 0 -i "$OUT/frames/segments.txt" -i "$OUT/mix.wav" \
 -c:v copy -c:a aac -b:a 256k -movflags +faststart -t 102 "$OUT/GIGI_Residence_by_ISROMANA_4K.mp4"
echo "→ $OUT/GIGI_Residence_by_ISROMANA_4K.mp4"

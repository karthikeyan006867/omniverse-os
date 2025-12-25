'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Upload } from 'lucide-react';

interface Track {
  name: string;
  url: string;
  duration: number;
}

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>([
    { name: 'Demo Track 1', url: '', duration: 180 },
  ]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(50);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newTracks: Track[] = Array.from(files).map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        duration: 0,
      }));
      setTracks([...tracks, ...newTracks]);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % tracks.length);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-900 via-gray-900 to-black text-white">
      {/* Track list */}
      <div className="flex-1 overflow-auto p-4">
        <h2 className="text-2xl font-bold mb-4">My Music</h2>
        <div className="space-y-2">
          {tracks.map((track, index) => (
            <div
              key={index}
              onClick={() => setCurrentTrack(index)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                currentTrack === index
                  ? 'bg-purple-600'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold">{track.name}</p>
                  <p className="text-sm text-gray-400">{formatTime(track.duration)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <label className="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-500">
          <Upload size={16} className="inline mr-2" />
          Upload Music
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Player controls */}
      <div className="p-6 bg-black/50 backdrop-blur">
        <div className="max-w-2xl mx-auto">
          <p className="text-center font-semibold mb-2">
            {tracks[currentTrack]?.name || 'No track selected'}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={tracks[currentTrack]?.duration || 100}
              value={currentTime}
              onChange={(e) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Number(e.target.value);
                }
              }}
              className="flex-1"
            />
            <span className="text-sm">{formatTime(tracks[currentTrack]?.duration || 0)}</span>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button onClick={prevTrack} className="p-2 hover:bg-gray-800 rounded-full">
              <SkipBack size={24} />
            </button>

            <button
              onClick={togglePlay}
              className="p-4 bg-white text-black rounded-full hover:bg-gray-200"
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </button>

            <button onClick={nextTrack} className="p-2 hover:bg-gray-800 rounded-full">
              <SkipForward size={24} />
            </button>

            <div className="flex items-center gap-2 ml-4">
              <Volume2 size={20} />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (audioRef.current) {
                    audioRef.current.volume = Number(e.target.value) / 100;
                  }
                }}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={tracks[currentTrack]?.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextTrack}
      />
    </div>
  );
}

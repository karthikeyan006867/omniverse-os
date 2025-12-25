'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, Download, RotateCw, Video, StopCircle } from 'lucide-react';
import { cloudinaryStorage } from '@/services/cloudinaryStorage';

export default function Camera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      alert('Camera access denied. Please allow camera permissions.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);
      }
    }
  };

  const downloadPhoto = async () => {
    if (capturedImage) {
      try {
        const result = await cloudinaryStorage.uploadBase64(capturedImage, 'photos');
        alert(`Photo uploaded! URL: ${result.url}`);
        
        const link = document.createElement('a');
        link.href = capturedImage;
        link.download = `photo-${Date.now()}.png`;
        link.click();
      } catch (error) {
        alert('Upload failed. Downloading locally...');
        const link = document.createElement('a');
        link.href = capturedImage;
        link.download = `photo-${Date.now()}.png`;
        link.click();
      }
    }
  };

  const startRecording = () => {
    if (stream) {
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `video-${Date.now()}.webm`;
        link.click();
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 relative flex items-center justify-center">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" className="max-h-full max-w-full" />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-h-full max-w-full"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}
      </div>

      <div className="p-4 bg-gray-900 flex items-center justify-center gap-4">
        {capturedImage ? (
          <>
            <button
              onClick={() => setCapturedImage(null)}
              className="px-6 py-3 bg-gray-700 rounded-full hover:bg-gray-600 flex items-center gap-2"
            >
              <RotateCw size={20} /> Retake
            </button>
            <button
              onClick={downloadPhoto}
              className="px-6 py-3 bg-blue-600 rounded-full hover:bg-blue-500 flex items-center gap-2"
            >
              <Download size={20} /> Save Photo
            </button>
          </>
        ) : (
          <>
            <button
              onClick={capturePhoto}
              className="px-8 py-4 bg-white text-black rounded-full hover:bg-gray-200 flex items-center gap-2 font-semibold"
            >
              <CameraIcon size={24} /> Capture
            </button>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-6 py-3 bg-red-600 rounded-full hover:bg-red-500 flex items-center gap-2"
              >
                <Video size={20} /> Record
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-6 py-3 bg-red-600 rounded-full hover:bg-red-500 flex items-center gap-2 animate-pulse"
              >
                <StopCircle size={20} /> Stop
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

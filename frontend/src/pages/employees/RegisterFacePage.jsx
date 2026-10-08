import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmployee, useRegisterFace } from '../../hooks/useEmployee.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { CheckCircle2, Camera, RefreshCw } from 'lucide-react';

export function RegisterFacePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useEmployee(id);
  const registerFaceMutation = useRegisterFace();

  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const employee = data?.data?.employee || data?.employee || data;

  // Stop webcam and release hardware track locks
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Start webcam
  const startCamera = async () => {
    try {
      setErrorMsg('');
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      setErrorMsg('Camera access denied or unavailable. Please enable permissions.');
    }
  };

  // Cleanup camera stream when navigating away or unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture current video frame
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    // Stop camera immediately after snapshot is captured
    stopCamera();

    // DEV: Liveness check disabled for employee face registration
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setSuccessMsg('');
    startCamera();
  };

  const handleSaveFace = async () => {
    if (!capturedImage) return;
    setErrorMsg('');
    try {
      // Mock 128-d biometric embedding vector
      const mockEmbedding = Array.from({ length: 128 }, () => Math.random() * 2 - 1);

      await registerFaceMutation.mutateAsync({
        id,
        data: {
          photoUrl: capturedImage,
          embedding: mockEmbedding
        }
      });

      // Explicitly terminate camera stream on successful face registration
      stopCamera();

      setSuccessMsg('Face biometric profile successfully registered and linked!');
      setTimeout(() => {
        navigate(`/employees/${id}`);
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to register face biometrics.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" className="text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Enroll Face Biometrics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enrolling biometrics for{' '}
            <span className="font-semibold text-slate-200">
              {employee?.firstName} {employee?.lastName} ({employee?.employeeCode})
            </span>
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            stopCamera();
            navigate(`/employees/${id}`);
          }}
        >
          Cancel
        </Button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-xl flex flex-col items-center">
        {/* Camera / Image Viewport */}
        <div className="relative w-full max-w-md aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 flex items-center justify-center shadow-inner">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured Face" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />
          )}

          {!cameraActive && !capturedImage && (
            <div className="text-center p-6 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-slate-300">Camera is inactive</p>
              <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-500">
                Enable Camera
              </Button>
            </div>
          )}

          {/* Face Guide Overlay */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-64 rounded-[50%] border-2 border-dashed border-blue-400/70 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse" />
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="mt-6 flex items-center gap-3">
          {cameraActive && !capturedImage && (
            <Button
              onClick={capturePhoto}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg"
            >
              Capture Face Snapshot
            </Button>
          )}

          {capturedImage && (
            <>
              <Button
                variant="outline"
                onClick={handleRetake}
                disabled={registerFaceMutation.isPending}
                className="flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                Re-capture Photo
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveFace}
                isLoading={registerFaceMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                Save Biometrics
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default RegisterFacePage;

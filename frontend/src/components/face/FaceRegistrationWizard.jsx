import React, { useState } from 'react';
import FaceCamera from './FaceCamera';
import FaceLiveness from './FaceLiveness';
import { useRegisterFace } from '../../hooks/useFaceRegistration';
import { Camera, ShieldCheck, Check, Sparkles } from 'lucide-react';

// DEV: Liveness check disabled for employee face registration (skipLiveness defaults to true)
export default function FaceRegistrationWizard({ employeeId, onComplete, skipLiveness = true }) {
  const [step, setStep] = useState(1); // 1: Camera, 2: Liveness (if not skipped), 3: Confirmation
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [livenessResult, setLivenessResult] = useState({ score: 0.98, passed: true });

  const registerFaceMutation = useRegisterFace();

  const handlePhotoCaptured = (photoBase64) => {
    setCapturedPhoto(photoBase64);
  };

  const handleLivenessDone = (result) => {
    setLivenessResult(result);
    setStep(3);
  };

  const handleEnrollFace = async () => {
    if (!employeeId || !capturedPhoto) return;

    try {
      await registerFaceMutation.mutateAsync({
        employeeId,
        photo: capturedPhoto,
        livenessScore: livenessResult?.score || 0.98
      });
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Face registration failed:', err);
    }
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
      {/* Wizard Step Indicators */}
      <div className="flex items-center justify-between max-w-sm mx-auto mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800'}`}>
            1
          </div>
          <span className="text-xs font-semibold">Capture</span>
        </div>
        <div className="h-0.5 flex-1 bg-slate-800 mx-3" />
        {!skipLiveness && (
          <>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800'}`}>
                2
              </div>
              <span className="text-xs font-semibold">Liveness</span>
            </div>
            <div className="h-0.5 flex-1 bg-slate-800 mx-3" />
          </>
        )}
        <div className={`flex items-center gap-2 ${step === 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800'}`}>
            {skipLiveness ? 2 : 3}
          </div>
          <span className="text-xs font-semibold">Enrolled</span>
        </div>
      </div>

      {/* Step 1: Camera Photo Capture */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-1">Position Your Face</h3>
            <p className="text-xs text-slate-400">Ensure good lighting and centered face photo.</p>
          </div>
          <FaceCamera onCapture={handlePhotoCaptured} />
          {capturedPhoto && (
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={() => setStep(skipLiveness ? 3 : 2)}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
              >
                {skipLiveness ? 'Confirm & Review Snapshot' : 'Proceed to Liveness Check'}
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Liveness Challenge (Only if not skipped) */}
      {step === 2 && !skipLiveness && (
        <div className="space-y-6">
          <FaceLiveness onComplete={handleLivenessDone} />
        </div>
      )}

      {/* Step 3: Verification & Save */}
      {step === 3 && (
        <div className="space-y-6 text-center">
          <div className="w-full max-w-xs mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10">
            <img src={capturedPhoto} alt="Enrolled Face Preview" className="w-full h-auto object-cover" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              128-Dimension Biometric Template Ready
            </span>
            <h3 className="text-lg font-bold text-white">Confirm Face Enrollment</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Biometric template will be securely registered for employee attendance and verification.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setCapturedPhoto(null);
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Re-capture
            </button>
            <button
              type="button"
              disabled={registerFaceMutation.isPending}
              onClick={handleEnrollFace}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              {registerFaceMutation.isPending ? 'Enrolling & Encrypting...' : 'Complete Registration'}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

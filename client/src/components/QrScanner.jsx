import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, AlertTriangle, RefreshCw } from 'lucide-react';

export default function QrScanner({ onScanSuccess, isScanningPaused = false }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const scannerRef = useRef(null);
  const scannerId = 'library-html5-qr-scanner';

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner stop error (safe to ignore):', err);
      } finally {
        scannerRef.current = null;
        setIsCameraActive(false);
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    try {
      await stopScanner();

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (!isScanningPaused) {
            console.log('[QR Scanned]', decodedText);
            onScanSuccess(decodedText.trim().toUpperCase());
          }
        },
        (errorMessage) => {
          // Frame-by-frame parse miss - normal during video stream
        }
      );

      setIsCameraActive(true);
      setHasCameraPermission(true);
    } catch (err) {
      console.warn('[Camera Scanner Init Failed]', err);
      setIsCameraActive(false);
      const isPermissionDenied =
        err.name === 'NotAllowedError' ||
        err.message?.includes('Permission') ||
        err.message?.includes('denied');

      if (isPermissionDenied) {
        setHasCameraPermission(false);
        setCameraError(
          'Webcam access was denied or is blocked by browser policy. Please use the manual accession code fallback below.'
        );
      } else {
        setCameraError(
          'Could not start webcam video stream. Please ensure camera is connected, or use the manual accession entry fallback.'
        );
      }
    }
  }, [isScanningPaused, onScanSuccess, stopScanner]);

  // Clean up on component unmount or strict mode remount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Webcam QR Barcode Scanner</h3>
        </div>

        <div>
          {isCameraActive ? (
            <button
              onClick={stopScanner}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Stop Camera</span>
            </button>
          ) : (
            <button
              onClick={startScanner}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Start Camera Scanner</span>
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Scanner Notice: </span>
            {cameraError}
          </div>
        </div>
      )}

      {/* Target DOM container for Html5Qrcode video */}
      <div className="relative bg-slate-900 rounded-lg overflow-hidden min-h-[260px] flex items-center justify-center">
        <div id={scannerId} className="w-full max-w-[320px] aspect-square mx-auto"></div>

        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-900/90">
            <Camera className="w-12 h-12 mb-2 text-slate-600" />
            <p className="text-xs max-w-xs">
              Click &ldquo;Start Camera Scanner&rdquo; to use your webcam, or use the manual accession code input below.
            </p>
          </div>
        )}

        {isScanningPaused && isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-2xs">
            <div className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-lg animate-pulse">
              ✓ Code Scanned — Processing
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-500 text-center mt-2">
        Align the QR code on the book spine/cover within the target frame.
      </p>
    </div>
  );
}

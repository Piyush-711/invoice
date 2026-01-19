import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

const ScannerModal = ({ onClose, onScanSuccess }) => {
    const [scanError, setScanError] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lastScannedText, setLastScannedText] = useState(null);

    const scannerRef = useRef(null);
    const lastScanTimeRef = useRef(0);
    const SCAN_DELAY = 2500; // 2.5 seconds between scans

    useEffect(() => {
        if (scannerRef.current) return;

        const startScanner = async () => {
            try {
                setLoading(true);
                setScanError(null);

                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 15,
                    qrbox: { width: 280, height: 280 },
                    aspectRatio: 1.0
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText, decodedResult) => {
                        const now = Date.now();
                        // Throttle scans
                        if (now - lastScanTimeRef.current < SCAN_DELAY) {
                            return;
                        }

                        lastScanTimeRef.current = now;
                        setLastScannedText(decodedText);

                        // Play a beep sound (optional, browser policy might block)
                        // const audio = new Audio('/beep.mp3'); audio.play().catch(e=>{});

                        onScanSuccess(decodedText);

                        // Clear "Scanned" message after delay
                        setTimeout(() => {
                            setLastScannedText(null);
                        }, 2000);
                    },
                    (errorMessage) => {
                        // ignore failures
                    }
                );

                setPermissionGranted(true);
                setLoading(false);

            } catch (err) {
                console.error("Error starting scanner:", err);
                setLoading(false);
                setScanError("Camera permission denied or camera not available.");
            }
        };

        const timer = setTimeout(startScanner, 500);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current.clear();
                    scannerRef.current = null;
                }).catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-90 flex items-center justify-center p-4 backdrop-blur-md transition-all">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 z-20">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Camera className="text-blue-600" size={20} />
                        Continuous Scan
                    </h2>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full text-sm font-semibold transition-colors text-gray-700"
                    >
                        Done
                    </button>
                </div>

                {/* Content Area */}
                <div className="relative bg-black h-[400px] flex items-center justify-center overflow-hidden">

                    <div id="reader" className="w-full h-full"></div>

                    {/* Success Overlay */}
                    {lastScannedText && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-green-500/20 backdrop-blur-sm animate-pulse">
                            <div className="bg-white rounded-full p-4 shadow-lg mb-2">
                                <CheckCircle2 className="text-green-600 w-12 h-12" />
                            </div>
                            <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                                <p className="font-bold text-gray-800">Scanned!</p>
                                <p className="text-xs text-gray-500">{lastScannedText}</p>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-10">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="font-medium">Starting Camera...</p>
                        </div>
                    )}

                    {scanError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-20 p-6 text-center">
                            <AlertCircle className="text-red-500 mb-2" size={48} />
                            <p className="text-lg font-bold mb-2">Camera Error</p>
                            <p className="text-sm text-gray-300 mb-6">{scanError}</p>
                            <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700">
                                <RefreshCw size={16} /> Retry
                            </button>
                        </div>
                    )}

                    {!loading && !scanError && permissionGranted && !lastScannedText && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] border-2 border-blue-500/50 rounded-lg">
                                <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-500 -ml-[2px] -mt-[2px]"></div>
                                <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-500 -mr-[2px] -mt-[2px]"></div>
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-500 -ml-[2px] -mb-[2px]"></div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-500 -mr-[2px] -mb-[2px]"></div>
                                <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-scan-laser top-1/2 transform -translate-y-1/2"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white text-sm text-gray-600 text-center border-t border-gray-100">
                    <p>Scanner will stay open. Processing takes 2s.</p>
                </div>

                <style>{`
                    @keyframes scan-laser { 0% { top: 10%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { top: 90%; opacity: 0; } }
                    .animate-scan-laser { animation: scan-laser 2s infinite linear; }
                    #reader video { object-fit: cover; width: 100% !important; height: 100% !important; }
                `}</style>
            </div>
        </div>
    );
};

export default ScannerModal;

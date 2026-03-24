import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

type ScanStatus = 'idle' | 'scanning' | 'found' | 'error' | 'searching';

export default function ScanCargo() {
  const navigate = useNavigate();
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('SCANNER_READY // AWAITING_INPUT');
  const [manualBol, setManualBol] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);

  // Stops the camera scanner and cleans up
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // Ignore errors on cleanup — camera may have already stopped
      }
      isRunningRef.current = false;
    }
  }, []);

  // Clean up the camera when the user leaves this page
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Takes a scanned BOL string and calls the backend to find the shipment
  const lookupByBol = useCallback(async (bol: string) => {
    setScanStatus('searching');
    setStatusMessage(`QUERYING_BOL: ${bol}...`);

    try {
      const res = await fetch(`/api/shipments/bol/${encodeURIComponent(bol.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setScanStatus('found');
        setStatusMessage(`MANIFEST_FOUND // BOL: ${bol}`);
        // Short delay so the user sees the success state before navigating
        setTimeout(() => navigate(`/shipments/${data.shipment_id}`), 600);
      } else {
        setScanStatus('error');
        setStatusMessage(`NO_MANIFEST_FOUND // BOL: ${bol}`);
      }
    } catch {
      setScanStatus('error');
      setStatusMessage('ERR_NETWORK_FAILURE // CHECK_CONNECTION');
    }
  }, [navigate]);

  // Called by html5-qrcode every time a code is successfully decoded
  const onScanSuccess = useCallback(async (decodedText: string) => {
    await stopScanner();
    setScanStatus('found');

    // Check if the scan result looks like one of our shipment URLs
    // e.g. "http://localhost:5173/shipments/abc-123-..."
    const shipmentUrlMatch = decodedText.match(/\/shipments\/([0-9a-f-]{36})/i);
    if (shipmentUrlMatch) {
      setStatusMessage(`MANIFEST_ID_DECODED // NAVIGATING...`);
      setTimeout(() => navigate(`/shipments/${shipmentUrlMatch[1]}`), 600);
      return;
    }

    // Otherwise treat it as a BOL number
    await lookupByBol(decodedText);
  }, [stopScanner, navigate, lookupByBol]);

  const startScanner = useCallback(async () => {
    setScanStatus('scanning');
    setStatusMessage('INITIALIZING_CAMERA...');

    // html5-qrcode needs a <div id="qr-reader"> to be in the DOM already
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' }, // Use the back camera on mobile
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {} // Ignore per-frame decode failures (normal — not every frame has a code)
      );
      isRunningRef.current = true;
      setStatusMessage('SCANNER_ACTIVE // AIM_AT_CODE');
    } catch {
      setScanStatus('error');
      setStatusMessage('ERR_CAMERA_ACCESS_DENIED // CHECK_PERMISSIONS');
    }
  }, [onScanSuccess]);

  const handleReset = useCallback(async () => {
    await stopScanner();
    setScanStatus('idle');
    setStatusMessage('SCANNER_READY // AWAITING_INPUT');
    setManualBol('');
    setManualError(null);
  }, [stopScanner]);

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBol.trim()) return;
    setManualError(null);

    const res = await fetch(`/api/shipments/bol/${encodeURIComponent(manualBol.trim())}`);
    if (res.ok) {
      const data = await res.json();
      navigate(`/shipments/${data.shipment_id}`);
    } else {
      setManualError(`No shipment found for BOL: ${manualBol.trim()}`);
    }
  };

  const statusColorClass = {
    idle:      'text-text-muted',
    scanning:  'text-accent-primary',
    found:     'text-status-ok',
    error:     'text-status-danger',
    searching: 'text-status-warn',
  }[scanStatus];

  return (
    <div className="p-8 flex flex-col gap-10">

      <header className="border-b border-subtle pb-6">
        <h1 className="font-display text-7xl text-accent-primary tracking-tighter leading-none uppercase">
          SCAN_CARGO // SCANNER
        </h1>
        <p className={`font-mono text-xs mt-2 tracking-[0.2em] ${statusColorClass}`}>
          {statusMessage}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Camera Panel ── */}
        <div className="flex flex-col gap-4">
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest mb-1">
            CAMERA_INPUT
          </div>

          {/* The div html5-qrcode attaches to. Always rendered so the DOM element is ready. */}
          <div
            className="border border-subtle bg-surface relative overflow-hidden"
            style={{ minHeight: '300px' }}
          >
            <div id="qr-reader" className="w-full" />

            {/* Overlay shown only when scanner is idle/error (before camera starts) */}
            {(scanStatus === 'idle' || scanStatus === 'error') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface">
                <div className="border border-subtle w-40 h-40 flex items-center justify-center">
                  {/* Stylized crosshair target */}
                  <div className="relative w-24 h-24">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent-primary" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent-primary" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent-primary" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-[9px] text-text-muted tracking-widest">STANDBY</span>
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-text-muted tracking-widest">
                  CAMERA_NOT_ACTIVE
                </span>
              </div>
            )}

            {/* Scanning animation overlay */}
            {scanStatus === 'scanning' && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-accent-primary/60 pointer-events-none"
                style={{ animation: 'scanline 2s linear infinite', top: '50%' }}
              />
            )}

            {/* Found overlay */}
            {(scanStatus === 'found' || scanStatus === 'searching') && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface">
                <div className="text-center">
                  <p className={`font-display text-4xl tracking-tight ${scanStatus === 'found' ? 'text-status-ok' : 'text-status-warn'}`}>
                    {scanStatus === 'found' ? 'CODE_ACQUIRED' : 'SEARCHING...'}
                  </p>
                  <p className="font-mono text-[10px] text-text-muted mt-2 tracking-widest">
                    {statusMessage}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Scanner control buttons */}
          <div className="flex gap-3">
            {scanStatus !== 'scanning' && (
              <button
                onClick={startScanner}
                className="btn-industrial flex-1"
              >
                {scanStatus === 'idle' ? 'INIT_SCANNER' : 'RESCAN'}
              </button>
            )}

            {scanStatus === 'scanning' && (
              <button
                onClick={handleReset}
                className="flex-1 border border-status-danger text-status-danger font-mono text-xs tracking-[0.2em] px-6 py-3 hover:bg-status-danger/10 transition-colors"
              >
                ABORT_SCAN
              </button>
            )}

            {(scanStatus === 'found' || scanStatus === 'error' || scanStatus === 'searching') && (
              <button
                onClick={handleReset}
                className="border border-subtle text-text-muted font-mono text-xs tracking-[0.2em] px-6 py-3 hover:bg-white/5 transition-colors"
              >
                RESET
              </button>
            )}
          </div>

          <p className="font-mono text-[9px] text-text-muted leading-relaxed">
            Supports: App-generated QR codes (shipment links) and existing BOL barcodes.
            Ensure camera permissions are granted in your browser.
          </p>
        </div>

        {/* ── Manual BOL Lookup Panel ── */}
        <div className="flex flex-col gap-4">
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest mb-1">
            MANUAL_INPUT // BOL_LOOKUP
          </div>

          <div className="border border-subtle bg-surface p-6 flex flex-col gap-6">
            <p className="font-mono text-xs text-text-muted leading-relaxed">
              No camera? Enter the Bill of Lading number manually to pull up the shipment.
            </p>

            <form onSubmit={handleManualLookup} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[9px] text-text-muted uppercase tracking-widest">
                  BOL_NUMBER
                </label>
                <input
                  type="text"
                  value={manualBol}
                  onChange={e => {
                    setManualBol(e.target.value);
                    setManualError(null);
                  }}
                  placeholder="e.g. BOL-2025-001"
                  className="bg-base border border-subtle text-text-primary font-mono text-sm px-4 py-3 w-full focus:outline-none focus:border-accent-primary/60 placeholder:text-text-muted/40 tracking-wider"
                />
              </div>

              {manualError && (
                <p className="font-mono text-xs text-status-danger border border-status-danger/30 bg-status-danger/10 px-3 py-2">
                  [!] {manualError}
                </p>
              )}

              <button
                type="submit"
                disabled={!manualBol.trim()}
                className="btn-industrial disabled:opacity-30 disabled:cursor-not-allowed"
              >
                LOOKUP_MANIFEST
              </button>
            </form>
          </div>

          {/* How it works callout */}
          <div className="border border-subtle p-5 flex flex-col gap-3">
            <p className="font-mono text-[9px] text-accent-primary uppercase tracking-widest">
              HOW_SCAN_WORKS
            </p>
            <ul className="font-mono text-[10px] text-text-muted leading-relaxed space-y-2">
              <li>&gt; Scan a ServerSeal QR code to jump directly to a shipment</li>
              <li>&gt; Scan an existing BOL barcode to look up by BOL number</li>
              <li>&gt; Use manual input if the barcode is damaged or unreadable</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

import { useState } from 'react';
import { Copy, Check, QrCode, BarChart3, ExternalLink, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="btn-secondary" onClick={handleCopy}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

export function QRModal({ url, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>QR Code</h3>
        <p>{url}</p>
        <div className="qr-container">
          <QRCodeSVG value={url} size={200} />
        </div>
        <div className="modal-actions">
          <CopyButton text={url} label="Copy URL" />
          <button className="btn-secondary" onClick={onClose}>
            <X size={14} /> Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResultCard({ result, onViewAnalytics }) {
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <div className="result-card">
        <div className="result-url">
          <a href={result.short_url} target="_blank" rel="noreferrer">
            {result.short_url}
          </a>
        </div>
        <div className="result-original">↪ {result.original_url}</div>
        <div className="result-actions">
          <CopyButton text={result.short_url} label="Copy Link" />
          <button className="btn-secondary" onClick={() => setShowQR(true)}>
            <QrCode size={14} /> QR Code
          </button>
          <button className="btn-secondary" onClick={() => navigate(`/analytics/${result.code}`)}>
            <BarChart3 size={14} /> Analytics
          </button>
          <a href={result.short_url} target="_blank" rel="noreferrer">
            <button className="btn-secondary">
              <ExternalLink size={14} /> Open
            </button>
          </a>
        </div>
      </div>
      {showQR && <QRModal url={result.short_url} onClose={() => setShowQR(false)} />}
    </>
  );
}

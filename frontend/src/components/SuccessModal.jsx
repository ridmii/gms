import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { FaCheck } from 'react-icons/fa';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, orderId }) => {
  const [downloadError, setDownloadError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000); // Confetti for 5s
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/invoice`, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setDownloadError('Failed to download invoice. Please try again or contact support.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="success-modal-overlay">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          className="confetti-canvas"
        />
      )}
      <div className="success-modal">
        <div className="success-icon">
          <FaCheck size={24} />
        </div>
        <h2 className="success-title">Order Submitted!</h2>
        <p className="success-message">
          Your order has been successfully submitted. Thank you for choosing DF Pvt(Ltd)
        </p>
        <p className="order-id">
          Order ID: <span>{orderId}</span>
        </p>
        {downloadError && <p className="error-message">{downloadError}</p>}
        <div className="button-group">
          <button
            onClick={handleDownload}
            className="success-button download-button"
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Download Invoice'}
          </button>
          <button onClick={onClose} className="success-button close-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;

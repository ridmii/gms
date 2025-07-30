import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { FaCheck } from 'react-icons/fa';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, orderId, email }) => {
  const [downloadError, setDownloadError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('SuccessModal opened with orderId:', orderId, 'email:', email); // Debug log
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, orderId, email]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      if (!orderId || !email) {
        throw new Error('Order ID or email is missing.');
      }

      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No admin token found. Please log in.');
      }

      const url = `http://localhost:5000/api/orders/${orderId}/invoice/public?email=${encodeURIComponent(email)}`;
      console.log('Fetching invoice from:', url, 'with token:', token);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = `Invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
    } catch (err) {
      console.error('Download error:', err);
      setDownloadError(`Failed to download invoice. ${err.message || 'Please try again or contact support.'}`);
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
            disabled={isDownloading || !orderId}
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
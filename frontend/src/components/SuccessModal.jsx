import { useEffect } from "react";

export default function SuccessModal({ isOpen, onClose, orderId }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="success-modal-overlay">
      <div className="success-modal">
        <div className="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="success-title">Order Placed Successfully!</h3>
        <p className="success-message">
          Thank you for your order. We've received your request and will contact you shortly.
        </p>
        {orderId && (
          <div className="order-id">
            Your Order ID: <span>{orderId}</span>
          </div>
        )}
        <button 
          onClick={onClose}
          className="success-button"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
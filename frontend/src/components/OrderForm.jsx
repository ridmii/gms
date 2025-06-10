import { useState, useEffect } from "react";
import axios from "axios";
import SuccessModal from "./SuccessModal"; // We'll create this component
import "./OrderForm.css"; // Custom CSS for additional styling

export default function OrderForm() {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    material: "",
    quantity: 1,
    artwork: false,
    artworkText: "",
    artworkImage: null,
  });

  // Price calculations
  const [priceDetails, setPriceDetails] = useState({
    unitPrice: 2000,
    total: 2000,
    advance: 1000,
    balance: 1000,
  });

  // Form status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    message: "",
    orderId: null,
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Calculate prices whenever quantity or artwork changes
  useEffect(() => {
    const qty = Number(formData.quantity) || 1;
    let unitPrice = 2000;
    
    // Bulk discount
    if (qty > 50) unitPrice = 1500;
    
    // Calculate totals
    const baseTotal = qty * unitPrice;
    const artworkFee = formData.artwork ? 5000 : 0;
    const total = baseTotal + artworkFee;
    const advance = Math.round(total * 0.5);
    const balance = total - advance;

    setPriceDetails({ unitPrice, total, advance, balance });
  }, [formData.quantity, formData.artwork]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" 
        ? checked 
        : type === "file" 
          ? files[0] 
          : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ success: false, message: "", orderId: null });

    try {
      // Prepare form data (including file if exists)
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });
      
      // Append price details
      formDataToSend.append("priceDetails", JSON.stringify(priceDetails));

      // Send to backend
      const response = await axios.post(
        "http://localhost:5000/api/orders", 
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Success handling
      setSubmitStatus({
        success: true,
        message: "Order submitted successfully!",
        orderId: response.data.order._id,
      });
      setShowSuccessModal(true);

      // Reset form (except for material which might be reused)
      setFormData({
        name: "",
        email: "",
        mobile: "",
        material: formData.material, // Keep material
        quantity: 1,
        artwork: false,
        artworkText: "",
        artworkImage: null,
      });

    } catch (error) {
      console.error("Submission error:", error);
      setSubmitStatus({
        success: false,
        message: error.response?.data?.message || 
                "Failed to submit order. Please try again.",
        orderId: null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="order-form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>Custom Printing Order</h2>
          <p className="text-gray-500">Fill out the form below to place your order</p>
        </div>
        
        {/* Submission status message */}
        {submitStatus.message && !submitStatus.success && (
          <div className="error-message">
            {submitStatus.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="form-group">
              <label className="form-label">
                Customer Name <span className="required">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                placeholder="John Doe"
                className="form-input"
                onChange={handleChange}
              />
            </div>

            {/* Mobile */}
            <div className="form-group">
              <label className="form-label">
                Mobile Number <span className="required">*</span>
              </label>
              <input
                name="mobile"
                type="tel"
                required
                value={formData.mobile}
                placeholder="0771234567"
                className="form-input"
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                placeholder="john@example.com"
                className="form-input"
                onChange={handleChange}
              />
            </div>

            {/* Material */}
            <div className="form-group">
              <label className="form-label">
                Material Type <span className="required">*</span>
              </label>
              <select
                name="material"
                required
                value={formData.material}
                className="form-input"
                onChange={handleChange}
              >
                <option value="">Select Material</option>
                <option value="Cotton">Cotton</option>
                <option value="Polyester">Polyester</option>
                <option value="Linen">Linen</option>
                <option value="Silk">Silk</option>
                <option value="Blend">Blend</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label className="form-label">
                Quantity <span className="required">*</span>
              </label>
              <div className="relative">
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  className="form-input pl-12"
                  onChange={handleChange}
                />
                <div className="quantity-badge">
                  {formData.quantity > 50 ? "Bulk Order" : "Standard"}
                </div>
              </div>
            </div>
          </div>

          {/* Artwork Checkbox */}
          <div className="flex items-center mt-6">
            <input
              id="artwork"
              type="checkbox"
              name="artwork"
              className="artwork-checkbox"
              checked={formData.artwork}
              onChange={handleChange}
            />
            <label htmlFor="artwork" className="artwork-label">
              Include Artwork Design (+Rs. 5000)
            </label>
          </div>

          {/* Artwork Details (conditional) */}
          {formData.artwork && (
            <div className="artwork-details">
              <div className="form-group">
                <label className="form-label">
                  Artwork Description
                </label>
                <textarea
                  name="artworkText"
                  rows="3"
                  value={formData.artworkText}
                  placeholder="Describe your design requirements..."
                  className="form-input"
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Upload Design File (Optional)
                </label>
                <div className="file-upload-wrapper">
                  <label className="file-upload-label">
                    <input
                      name="artworkImage"
                      type="file"
                      accept="image/*,.pdf,.ai,.eps"
                      className="file-upload-input"
                      onChange={handleChange}
                    />
                    <div className="file-upload-content">
                      {formData.artworkImage ? (
                        <span className="file-selected">{formData.artworkImage.name}</span>
                      ) : (
                        <>
                          <svg className="file-upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="file-upload-text">Click to upload or drag and drop</span>
                          <span className="file-upload-hint">AI, EPS, PDF, PNG, JPG (Max. 10MB)</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className="price-summary">
            <h3>Order Summary</h3>
            <div className="price-grid">
              <div>Unit Price:</div>
              <div className="text-right">Rs. {priceDetails.unitPrice.toLocaleString()}</div>
              
              <div>Artwork Fee:</div>
              <div className="text-right">
                {formData.artwork ? "Rs. 5,000" : "Rs. 0"}
              </div>
              
              <div className="border-t border-gray-200 pt-2 font-medium">Total:</div>
              <div className="border-t border-gray-200 pt-2 text-right font-bold text-primary">
                Rs. {priceDetails.total.toLocaleString()}
              </div>
              
              <div>Advance (50%):</div>
              <div className="text-right">
                Rs. {priceDetails.advance.toLocaleString()}
              </div>
              
              <div>Balance Due:</div>
              <div className="text-right">
                Rs. {priceDetails.balance.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Submit Order"
            )}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
        orderId={submitStatus.orderId}
      />
    </div>
  );
}
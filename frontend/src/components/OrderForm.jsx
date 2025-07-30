import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import SuccessModal from './SuccessModal';
import axios from 'axios';
import '../styles/OrderForm.css';
import '../styles/Header.css';
import '../styles/Footer.css';

const OrderForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    material: 'Cotton',
    quantity: 30,
    artworkFile: null,
    artworkText: '',
    artwork: false
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState(''); // Store email at submission
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  const unitPrice = formData.quantity > 30 ? 1500 : 2000;
  const artworkFee = formData.artwork ? 5000 : 0;
  const subtotal = formData.quantity * unitPrice;
  const total = subtotal + artworkFee;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ 
      ...prev, 
      artworkFile: e.target.files[0],
      artwork: true 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.mobile || !formData.address || !formData.material || !formData.quantity) {
      setError('All required fields must be filled.');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('mobile', formData.mobile);
    formDataToSend.append('address', formData.address);
    formDataToSend.append('material', formData.material);
    formDataToSend.append('quantity', formData.quantity);
    formDataToSend.append('artwork', formData.artwork);
    if (formData.artworkFile) formDataToSend.append('artworkFile', formData.artworkFile);
    if (formData.artworkText) formDataToSend.append('artworkText', formData.artworkText);

    const unitPrice = formData.quantity > 30 ? 1500 : 2000;
    const artworkFee = formData.artwork ? 5000 : 0;
    const subtotal = formData.quantity * unitPrice;
    const total = subtotal + artworkFee;
    const advance = Math.round(total * 0.5);
    const balance = total - advance;
    formDataToSend.append('priceDetails', JSON.stringify({ unitPrice, subtotal, artworkFee, total, advance, balance }));

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('http://localhost:5000/api/orders', formDataToSend, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGRpbWFsc2hhLmNvbSIsImlhdCI6MTc1Mzg1Mjc1MSwiZXhwIjoxNzUzOTM5MTUxfQ.rluCGGNCNmVIYjj_7JLpluVa9lRAAvjIzZAEDyOoTy4'}` 
        },
      });
      console.log('API Response:', response.data); // Debug
      const newOrderId = response.data.order?._id || response.data._id;
      if (!newOrderId) throw new Error('Order ID not returned from server');
      setOrderId(newOrderId);
      setSubmittedEmail(formData.email); // Save email at submission
      setShowSuccessModal(true);
      setError(null);
    } catch (err) {
      console.error('Submit Error:', err.response?.data || err.message);
      setError(`Failed to submit order. ${err.response?.data?.message || err.message || 'Please try again.'}`);
    } finally {
      if (!error) {
        setFormData({
          name: '',
          email: '',
          mobile: '',
          address: '',
          material: 'Cotton',
          quantity: 30,
          artworkFile: null,
          artworkText: '',
          artwork: false
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Layout activePage="place-order">
      <motion.div 
        className="place-order-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="order-header"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Place Your Order</h1>
          <p>Complete the form below to submit your garment production request</p>
        </motion.div>

        <div className="order-content">
          <motion.form 
            onSubmit={handleSubmit}
            className="order-form"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="form-section">
              <h2>Factory Information</h2>
              <div className="form-group">
                <label>Factory Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mobile Number <span className="required">*</span></label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address <span className="required">*</span></label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Production Details</h2>
              <div className="form-group">
                <label>Material <span className="required">*</span></label>
                <select
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  required
                >
                  <option value="Cotton">Cotton</option>
                  <option value="Polyester">Polyester</option>
                  <option value="Linen">Linen</option>
                  <option value="Silk">Silk</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Quantity <span className="required">*</span></label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
                <p className="quantity-note">
                  {formData.quantity > 30 
                    ? "✓ Bulk order discount applied (LKR 1,500/unit)"
                    : "Regular pricing (LKR 2,000/unit)"}
                </p>
              </div>
            </div>

            <div className="form-section">
              <h2>Artwork Details</h2>
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="artwork"
                  name="artwork"
                  checked={formData.artwork}
                  onChange={handleChange}
                />
                <label htmlFor="artwork">
                  Include custom artwork (+LKR 5,000)
                </label>
              </div>

              {formData.artwork && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="form-group">
                    <label>Upload Artwork File</label>
                    <div 
                      className="file-upload-area"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,.pdf,.ai,.eps"
                        style={{ display: 'none' }}
                      />
                      <p>Drag & drop files or click to browse</p>
                      <p className="file-types">Supports: PNG, JPG, PDF, AI, EPS (Max 10MB)</p>
                      {formData.artworkFile && (
                        <p className="file-name">
                          Selected: {formData.artworkFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Artwork Description</label>
                    <textarea
                      name="artworkText"
                      value={formData.artworkText}
                      onChange={handleChange}
                      placeholder="Describe your artwork requirements..."
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <motion.button 
              type="submit" 
              className="submit-order-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Submit Order
            </motion.button>
            {error && <p className="error-message">{error}</p>}
          </motion.form>

          <motion.div 
            className="order-summary"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2>Order Summary</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span>Material:</span>
                <span>{formData.material}</span>
              </div>
              <div className="summary-item">
                <span>Quantity:</span>
                <span>{formData.quantity} units</span>
              </div>
              <div className="summary-item">
                <span>Unit Price:</span>
                <span>LKR {unitPrice.toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span>Subtotal:</span>
                <span>LKR {subtotal.toLocaleString()}</span>
              </div>
              {formData.artwork && (
                <div className="summary-item">
                  <span>Artwork Fee:</span>
                  <span>LKR {artworkFee.toLocaleString()}</span>
                </div>
              )}
              <div className="summary-total">
                <span>Total Amount:</span>
                <span>LKR {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="delivery-info">
              <h3>Production Timeline</h3>
              <p>Standard production time is 2-3 weeks from order confirmation.</p>
              <p>Rush production available (additional charges apply).</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderId={orderId}
        email={submittedEmail || formData.email} // Fallback to formData.email
      />
    </Layout>
  );
};

export default OrderForm;
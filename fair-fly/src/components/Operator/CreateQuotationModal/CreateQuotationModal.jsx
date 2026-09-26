import { useState, useEffect } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import { createQuotation } from '../../../services/quotationService';
import { fetchServices } from '../../../services/serviceService';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './create-quotation-modal.css';

export default function CreateQuotationModal({ isOpen, onClose, initialData, onQuotationCreated }) {
  const { user, userDetails, userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeServices, setActiveServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [formData, setFormData] = useState({
    inquiryId: null,
    clientUid: null,
    clientName: '',
    contactPerson: '',
    clientEmail: '',
    clientPhone: '',
    serviceId: '',
    serviceTitle: '',
    requirements: '',
    tourDates: '',
    inclusions: '- Tourist Bus Transport\n- Driver\'s Fee, fuel, and allowances\n- Standard travel insurance coverage',
    exclusions: '- Toll fees (NLEX / SCTEX / TPLEX)\n- Personal expenses, meals, and incidental items',
    rate: '',
    taxAmount: '',
    rateBreakdown: '',
    totalAmount: '',
    remarks: '- Initial payment of 50% upon confirmation\n- Full payment on or before tour commencement',
    preparedByName: userDetails?.name || userDetails?.fullName || 'Emmanuel Manlapig',
    preparedByTitle: userDetails?.role === 'admin' ? 'Business Head' : 'Branch Operator',
    preparedByContact: userDetails?.phone || userDetails?.phoneNumber || '0997 4763844',
  });

  // Pre-fill with initialData (e.g. from Inquiry) when opening
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const reqsText = initialData.specifiedRequirements || initialData.requirements || '';
        const serviceName = initialData.serviceType || 
          (Array.isArray(initialData.servicesOffered) ? initialData.servicesOffered.join(', ') : 'Custom Package');

        setFormData((prev) => ({
          ...prev,
          inquiryId: initialData.id || null,
          clientUid: initialData.clientUid || null,
          clientName: initialData.clientName || initialData.fullName || '',
          contactPerson: initialData.contactPerson || initialData.fullName || '',
          clientEmail: initialData.email || '',
          clientPhone: initialData.cellphone || initialData.phoneNumber || initialData.telNo || '',
          serviceId: initialData.serviceId || '',
          serviceTitle: serviceName,
          requirements: reqsText,
          remarks: initialData.remarks || prev.remarks
        }));
      }
    }
  }, [isOpen, initialData]);

  // Fetch active catalog services for optional selection
  useEffect(() => {
    if (!isOpen) return;
    setLoadingServices(true);
    const branchUid = userDetails?.role === 'operator' ? user?.uid : null;
    fetchServices(
      branchUid,
      (services) => {
        const activeOnly = Array.isArray(services) ? services.filter(s => s.status === 'Active') : [];
        setActiveServices(activeOnly);
        setLoadingServices(false);
      },
      (err) => {
        console.error('Error loading active services for quotation modal:', err);
        setLoadingServices(false);
      }
    );
  }, [isOpen, user?.uid, userDetails?.role]);

  const extractServiceRate = (service) => {
    if (!service) return 0;
    if (typeof service.price === 'number') return service.price;
    if (typeof service.baseFee === 'number') return service.baseFee;
    const rawStr = String(service.price || service.baseFee || '0');
    const sanitized = rawStr.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'rate' || name === 'taxAmount') {
        const numRate = Number(name === 'rate' ? value : prev.rate) || 0;
        const numTax = Number(name === 'taxAmount' ? value : prev.taxAmount) || 0;
        const total = numRate + numTax;
        updated.totalAmount = total > 0 ? String(total) : (numRate > 0 ? String(numRate) : '');

        if (numRate > 0) {
          if (numTax > 0) {
            updated.rateBreakdown = `Php ${numRate.toLocaleString('en-US', { minimumFractionDigits: 2 })} + Php ${numTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Tax/Surcharge)`;
          } else {
            updated.rateBreakdown = `Php ${numRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          }
        }
      }
      return updated;
    });
  };

  const handleServiceSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      return;
    }

    const matched = activeServices.find(s => s.id === selectedId);
    if (matched) {
      const baseRateNum = extractServiceRate(matched);
      const taxNum = Number(formData.taxAmount) || 0;
      const totalNum = baseRateNum + taxNum;

      let breakdownStr = '';
      if (baseRateNum > 0) {
        if (taxNum > 0) {
          breakdownStr = `Php ${baseRateNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} + Php ${taxNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Tax/Surcharge)`;
        } else {
          breakdownStr = `Php ${baseRateNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }
      }

      setFormData(prev => ({
        ...prev,
        serviceId: matched.id,
        serviceTitle: matched.name,
        rate: baseRateNum > 0 ? String(baseRateNum) : (prev.rate || ''),
        totalAmount: totalNum > 0 ? String(totalNum) : (prev.totalAmount || ''),
        rateBreakdown: breakdownStr || prev.rateBreakdown
      }));
    }
  };

  const isFormValid = Boolean(
    formData.clientName.trim() &&
    (formData.serviceTitle.trim() || formData.serviceId) &&
    formData.requirements.trim() &&
    formData.rate !== '' &&
    Number(formData.rate) >= 0 &&
    formData.totalAmount !== '' &&
    Number(formData.totalAmount) >= 0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName || (!formData.serviceTitle && !formData.serviceId)) {
      addToast('Client name and service title are required', 'error');
      return;
    }

    const payload = {
      ...formData,
      rate: Number(formData.rate) || 0,
      taxAmount: Number(formData.taxAmount) || 0,
      totalAmount: Number(formData.totalAmount || formData.rate) || 0,
      branchUid: (userDetails?.role === 'operator' || userDetails?.role === 'branch_operator') 
        ? user?.uid 
        : (initialData?.branchUid || formData.branchUid || null),
      branchName: (userDetails?.role === 'operator' || userDetails?.role === 'branch_operator')
        ? (userDetails?.branchName || userDetails?.name || 'Branch Office')
        : (initialData?.branchName || formData.branchName || 'Branch Office'),
    };

    setIsSubmitting(true);
    createQuotation(
      userToken,
      payload,
      (res) => {
        setIsSubmitting(false);
        addToast('Official Quotation (ADF-07-001) created successfully', 'success');
        if (onQuotationCreated) {
          onQuotationCreated(res);
        }
        onClose();
      },
      (error) => {
        setIsSubmitting(false);
        addToast(toFriendlyMessage(error, 'Could not create quotation. Please check your inputs.'), 'error');
      },
      setIsSubmitting
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="720px"
      title="Create Service Quotation (ADF-07-001)"
      subtitle="Generate an official quotation based on client requirements"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="create-quote-form">
        {formData.inquiryId && (
          <div className="quote-inquiry-linked-badge">
            <i className="fa-solid fa-link"></i>
            <span>Linking to Client Inquiry Form: <strong>{initialData?.controlNo || formData.inquiryId}</strong></span>
          </div>
        )}

        {/* Section 1: Client & Contact */}
        <div className="quote-form-section">
          <h4 className="quote-section-title">
            <i className="fa-solid fa-building"></i> 1. Client Information
          </h4>

          <div className="form-grid-2">
            <div className="form-column">
              <label className="form-label">Name of Client / Company *</label>
              <input
                type="text"
                name="clientName"
                placeholder="e.g. COSMETIQUE ASIA CORP."
                value={formData.clientName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                placeholder="e.g. Ms. Marichu Kalalang"
                value={formData.contactPerson}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-column">
              <label className="form-label">Contact Phone / Mobile</label>
              <input
                type="text"
                name="clientPhone"
                placeholder="e.g. 0917 123 4567"
                value={formData.clientPhone}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Client Email</label>
              <input
                type="email"
                name="clientEmail"
                placeholder="client@company.com"
                value={formData.clientEmail}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Service & Requirements */}
        <div className="quote-form-section">
          <h4 className="quote-section-title">
            <i className="fa-solid fa-layer-group"></i> 2. Service & Specifications
          </h4>

          <div className="form-grid-2">
            {activeServices.length > 0 && (
              <div className="form-column">
                <label className="form-label">Link Catalog Service (Optional)</label>
                <select
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleServiceSelect}
                  disabled={isSubmitting || loadingServices}
                  className="form-input"
                >
                  <option value="">-- Associate with Catalog Service --</option>
                  {activeServices.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.price || 'PHP ' + (s.baseFee || '')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-column">
              <label className="form-label">Service / Tour Subject Title *</label>
              <input
                type="text"
                name="serviceTitle"
                placeholder="e.g. 3D/2N Bolinao-Alaminos Tourist Bus Package"
                value={formData.serviceTitle}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-column">
            <label className="form-label">Requirements (What the Client Wants) *</label>
            <textarea
              name="requirements"
              placeholder="• (1) Unit Tourist Bus&#10;• Equipped with video and audio entertainment system&#10;• 49 Regular seats&#10;• 3D/2N – QC-Bolinao-Alaminos-QC"
              value={formData.requirements}
              onChange={handleChange}
              rows={4}
              disabled={isSubmitting}
              className="form-input"
              required
            />
          </div>

          <div className="form-column">
            <label className="form-label">Tour Dates / Itinerary Breakdown</label>
            <textarea
              name="tourDates"
              placeholder="April 29, 2023: Pick up QC to Bolinao&#10;April 30, 2023: Bolinao to Alaminos&#10;May 1, 2023: Alaminos to QC"
              value={formData.tourDates}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>
        </div>

        {/* Section 3: Inclusions & Exclusions */}
        <div className="quote-form-section">
          <h4 className="quote-section-title">
            <i className="fa-solid fa-list-check"></i> 3. Inclusions & Exclusions
          </h4>

          <div className="form-column">
            <label className="form-label">Package Inclusions</label>
            <textarea
              name="inclusions"
              placeholder="- Driver's Fee, food and lodging&#10;- Fuel and vehicle maintenance"
              value={formData.inclusions}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>

          <div className="form-column">
            <label className="form-label">Package Exclusions</label>
            <textarea
              name="exclusions"
              placeholder="- Toll Fee (NLEX/TPLEX) Estimated amount Php 2,000-Php 2,500&#10;- Personal expenses, meals, and incidental items"
              value={formData.exclusions}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>
        </div>

        {/* Section 4: Rates & Pricing */}
        <div className="quote-form-section">
          <h4 className="quote-section-title">
            <i className="fa-solid fa-coins"></i> 4. Pricing & Rates
          </h4>

          <div className="form-grid-3">
            <div className="form-column">
              <label className="form-label">Base Rate (PHP) *</label>
              <input
                type="number"
                name="rate"
                placeholder="55000"
                value={formData.rate}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="form-input"
                min="0"
                step="any"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Tax / Surcharge (PHP)</label>
              <input
                type="number"
                name="taxAmount"
                placeholder="1100"
                value={formData.taxAmount}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
                min="0"
                step="any"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Total Amount (PHP) *</label>
              <input
                type="number"
                name="totalAmount"
                placeholder="56100"
                value={formData.totalAmount}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="form-input"
                min="0"
                step="any"
              />
            </div>
          </div>

          <div className="form-column">
            <label className="form-label">Rate Breakdown Display</label>
            <input
              type="text"
              name="rateBreakdown"
              placeholder="e.g. Php 55,000.00/bus + Php 1,100.00 / 2% Withholding tax"
              value={formData.rateBreakdown}
              onChange={handleChange}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>
        </div>

        {/* Section 5: Remarks & Authorizations */}
        <div className="quote-form-section">
          <h4 className="quote-section-title">
            <i className="fa-solid fa-signature"></i> 5. Remarks & Prepared By
          </h4>

          <div className="form-column">
            <label className="form-label">Payment Terms & Remarks</label>
            <textarea
              name="remarks"
              placeholder="- Initial payment upon confirmation&#10;- Full payment on or before service commencement"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>

          <div className="form-grid-3">
            <div className="form-column">
              <label className="form-label">Prepared By Name</label>
              <input
                type="text"
                name="preparedByName"
                value={formData.preparedByName}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Title / Role</label>
              <input
                type="text"
                name="preparedByTitle"
                value={formData.preparedByTitle}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                name="preparedByContact"
                value={formData.preparedByContact}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="quote-modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary quote-modal-submit-btn"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-invoice-dollar"></i>
                <span>Create Quotation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

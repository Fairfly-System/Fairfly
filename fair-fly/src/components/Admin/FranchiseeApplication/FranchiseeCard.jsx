import { Mail, Phone, MapPin, Luggage, Banknote, Clock } from "lucide-react";
import "./franchisee-card.css";

export default function FranchiseCard({
  avatar = "https://placehold.co/400x400/000000/FFFFFF?text=P",
  name,
  email,
  status,
  contactNumber,
  address,
  experience,
  investmentCapacity,
  preferredMeetingDate,
  additionalMessage = "None",
  onView,
  onDelete,
}) {
  return (
    <div className={`franchise-card ${status.toLowerCase()}`}>
      <div className="franchise-card-header">
        <div className="franchisee-info">
          <img
            src={avatar}
            alt="Franchisee"
            className="franchisee-avatar"
          />
          <div className="franchisee-details">
            <h3>{name}</h3>
            <p>
              {email} <span className={`franchisee-status ${status.toLowerCase()}`}>{status}</span>
            </p>
          </div>
        </div>
        <div className="franchise-card-actions">
          <button className="action-btn view" onClick={onView}>
            View Details
          </button>
        </div>
      </div>

      <div className="franchise-card-body">
        <div className="franchise-card-item">
          <h3 className="item-title">
            <Mail size={18} color="steelblue" /> Email
          </h3>
          <p className="item-value">{email}</p>
        </div>
        <div className="franchise-card-item">
          <h3 className="item-title">
            <Phone size={18} color="steelblue" /> Contact Number
          </h3>
          <p className="item-value">{contactNumber}</p>
        </div>
        <div className="franchise-card-item">
          <h3 className="item-title">
            <MapPin size={18} color="steelblue" /> Address
          </h3>
          <p className="item-value">{address}</p>
        </div>
        <div className="franchise-card-item">
          <h3 className="item-title">
            <Luggage size={18} color="orange" /> Business Experience
          </h3>
          <p className="item-value">{experience}</p>
        </div>
        <div className="franchise-card-item">
          <h3 className="item-title">
            <Banknote size={18} color="green" /> Investment Capacity
          </h3>
          <p className="item-value">{investmentCapacity}</p>
        </div>
        <div className="franchise-card-item">
          <h3 className="item-title">
            <Clock size={18} color="steelblue" /> Preferred Meeting Date
          </h3>
          <p className="item-value">{preferredMeetingDate}</p>
        </div>
      </div>

      <div className="franchise-card-footer">
        <h3>ADDITIONAL MESSAGE:</h3>
        <p className="additional-message">{additionalMessage}</p>
      </div>
    </div>
  );
}
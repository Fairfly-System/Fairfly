import React, { useState, useEffect, useRef } from 'react';
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchBarangays,
  formatAddressString
} from '../../../services/psgcService';
import './psgc-address-selector.css';

/**
 * Reusable Philippine Geographic Location Selector (PSGC Cloud API)
 * Province -> City / Municipality -> Barangay -> Building / Street
 */
export default function PsgcAddressSelector({
  value = {},
  onChange,
  required = true,
  disabled = false,
  idPrefix = 'psgc-addr',
  label = 'Complete Address',
  icon = 'fa-solid fa-location-dot',
  showCard = true,
  showBuilding = true,
  buildingLabel = 'Building / Unit / Street',
  buildingPlaceholder = 'e.g., Unit 3A, Main Street'
}) {
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  const prevProvinceCodeRef = useRef(value.provinceCode);
  const prevMunicipalityCodeRef = useRef(value.municipalityCode);

  // 1. Load provinces list on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingProvinces(true);

    fetchProvinces()
      .then((data) => {
        if (isMounted) {
          setProvinces(data);
          // If we have a province name but no provinceCode, attempt auto-match
          if (value.province && !value.provinceCode) {
            const matched = data.find(
              (p) => p.name.toLowerCase() === value.province.toLowerCase()
            );
            if (matched && onChange) {
              const nextVal = {
                ...value,
                provinceCode: matched.code,
                province: matched.name
              };
              onChange(nextVal, formatAddressString(nextVal));
            }
          }
        }
      })
      .catch((err) => {
        console.warn('[PsgcAddressSelector] Failed to load provinces:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingProvinces(false);
      });

    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Load municipalities when provinceCode changes
  useEffect(() => {
    let isMounted = true;
    if (!value.provinceCode) {
      setMunicipalities([]);
      setBarangays([]);
      return;
    }

    setLoadingMunicipalities(true);
    fetchMunicipalities(value.provinceCode)
      .then((data) => {
        if (isMounted) {
          setMunicipalities(data);
          // If we have municipality name without code, attempt auto-match
          if (value.municipality && !value.municipalityCode) {
            const matched = data.find(
              (m) => m.name.toLowerCase() === value.municipality.toLowerCase()
            );
            if (matched && onChange) {
              const nextVal = {
                ...value,
                municipalityCode: matched.code,
                municipality: matched.name
              };
              onChange(nextVal, formatAddressString(nextVal));
            }
          }
        }
      })
      .catch((err) => {
        console.warn('[PsgcAddressSelector] Failed to load municipalities:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingMunicipalities(false);
      });

    return () => {
      isMounted = false;
    };
  }, [value.provinceCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Load barangays when municipalityCode changes
  useEffect(() => {
    let isMounted = true;
    if (!value.municipalityCode) {
      setBarangays([]);
      return;
    }

    setLoadingBarangays(true);
    fetchBarangays(value.municipalityCode)
      .then((data) => {
        if (isMounted) {
          setBarangays(data);
        }
      })
      .catch((err) => {
        console.warn('[PsgcAddressSelector] Failed to load barangays:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingBarangays(false);
      });

    return () => {
      isMounted = false;
    };
  }, [value.municipalityCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle province select change
  const handleProvinceSelect = (e) => {
    const selectedCode = e.target.value;
    const selected = provinces.find((p) => p.code === selectedCode);

    const nextVal = {
      ...value,
      provinceCode: selected?.code || '',
      province: selected?.name || '',
      municipalityCode: '',
      municipality: '',
      barangay: ''
    };

    prevProvinceCodeRef.current = selectedCode;
    onChange(nextVal, formatAddressString(nextVal));
  };

  // Handle municipality select change
  const handleMunicipalitySelect = (e) => {
    const selectedCode = e.target.value;
    const selected = municipalities.find((m) => m.code === selectedCode);

    const nextVal = {
      ...value,
      municipalityCode: selected?.code || '',
      municipality: selected?.name || '',
      barangay: ''
    };

    prevMunicipalityCodeRef.current = selectedCode;
    onChange(nextVal, formatAddressString(nextVal));
  };

  // Handle barangay select change
  const handleBarangaySelect = (e) => {
    const selectedBarangay = e.target.value;
    const nextVal = {
      ...value,
      barangay: selectedBarangay
    };
    onChange(nextVal, formatAddressString(nextVal));
  };

  // Handle building text input change
  const handleBuildingChange = (e) => {
    const building = e.target.value;
    const nextVal = {
      ...value,
      building
    };
    onChange(nextVal, formatAddressString(nextVal));
  };

  return (
    <div className={`psgc-address-section ${showCard ? 'as-card' : ''}`}>
      {label && (
        <p className="psgc-section-label">
          {icon && <i className={icon} />}
          <span>{label}</span>
          {required && <span className="req-star">*</span>}
        </p>
      )}

      {/* Row 1: Province & City/Municipality */}
      <div className="psgc-row">
        <div className="psgc-group">
          <label htmlFor={`${idPrefix}-province`}>
            Province {required && <span className="req-star">*</span>}
          </label>
          <select
            id={`${idPrefix}-province`}
            className="psgc-select"
            value={value.provinceCode || ''}
            onChange={handleProvinceSelect}
            disabled={disabled || loadingProvinces}
            required={required}
          >
            <option value="">
              {loadingProvinces ? 'Loading provinces...' : 'Select province'}
            </option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="psgc-group">
          <label htmlFor={`${idPrefix}-municipality`}>
            City / Municipality {required && <span className="req-star">*</span>}
          </label>
          <select
            id={`${idPrefix}-municipality`}
            className="psgc-select"
            value={value.municipalityCode || ''}
            onChange={handleMunicipalitySelect}
            disabled={disabled || !value.provinceCode || loadingMunicipalities}
            required={required}
          >
            <option value="">
              {loadingMunicipalities
                ? 'Loading cities...'
                : !value.provinceCode
                ? 'Select province first'
                : 'Select city/municipality'}
            </option>
            {municipalities.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Barangay & Building/Unit */}
      <div className="psgc-row">
        <div className="psgc-group">
          <label htmlFor={`${idPrefix}-barangay`}>
            Barangay {required && <span className="req-star">*</span>}
          </label>
          <select
            id={`${idPrefix}-barangay`}
            className="psgc-select"
            value={value.barangay || ''}
            onChange={handleBarangaySelect}
            disabled={disabled || !value.municipalityCode || loadingBarangays}
            required={required}
          >
            <option value="">
              {loadingBarangays
                ? 'Loading barangays...'
                : !value.municipalityCode
                ? 'Select city first'
                : 'Select barangay'}
            </option>
            {barangays.map((b) => (
              <option key={b.code} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {showBuilding && (
          <div className="psgc-group">
            <label htmlFor={`${idPrefix}-building`}>
              {buildingLabel} <span className="optional-badge">(Optional)</span>
            </label>
            <input
              id={`${idPrefix}-building`}
              type="text"
              className="psgc-input"
              placeholder={buildingPlaceholder}
              value={value.building || ''}
              onChange={handleBuildingChange}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}

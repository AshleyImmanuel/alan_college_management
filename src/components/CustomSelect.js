import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

const CustomSelect = ({ label, icon, placeholder, options, id, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            <div className={`custom-select ${isOpen ? 'open' : ''}`} ref={ref}>
                <button
                    type="button"
                    className="custom-select-trigger"
                    onClick={() => setIsOpen(!isOpen)}
                    id={id}
                >
                    <span className="custom-select-icon">
                        <i className={icon}></i>
                    </span>
                    <span className={`custom-select-value ${!selectedOption ? 'placeholder' : ''}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <span className="custom-select-arrow">
                        <i className="fa-solid fa-chevron-down"></i>
                    </span>
                </button>
                {isOpen && (
                    <ul className="custom-select-dropdown">
                        {options.map((opt) => (
                            <li
                                key={opt.value}
                                className={`custom-select-option ${selectedOption?.value === opt.value ? 'selected' : ''}`}
                                onClick={() => {
                                    setIsOpen(false);
                                    if (onChange) onChange(opt.value);
                                }}
                            >
                                {opt.label}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CustomSelect;

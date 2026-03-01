import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './EnrollNowPage.css';

const initialFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    courseInterest: '',
    message: ''
};

const EnrollNowPage = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setSubmitted(true);
        setFormData(initialFormData);
    };

    return (
        <div className="enroll-page-wrapper">
            <Header />

            <div className="enroll-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1920&q=80')" }}>
                <div className="enroll-hero-overlay"></div>
                <div className="container enroll-hero-content">
                    <span className="enroll-tag">PARKER UNIVERSITY</span>
                    <h1>Enquiry Contact</h1>
                    <p>Tell us what you are looking for and our admissions team will contact you.</p>
                </div>
            </div>

            <main className="enroll-main">
                <div className="container">
                    <section className="enroll-section enquiry-contact-section">
                        <div className="enquiry-contact-grid">
                            <div className="enquiry-info-card">
                                <h2>Contact Admissions</h2>
                                <p>
                                    Share your details and questions. We usually reply within one business day.
                                </p>
                                <ul className="enquiry-contact-list">
                                    <li><i className="fa-solid fa-envelope"></i> admissions@parker.edu</li>
                                    <li><i className="fa-solid fa-phone"></i> +1 (555) 240-8890</li>
                                    <li><i className="fa-solid fa-location-dot"></i> City Center Campus, Parker University</li>
                                </ul>
                            </div>

                            <div className="enquiry-form-card">
                                <h3>Send Enquiry</h3>
                                {submitted && (
                                    <div className="enquiry-success">
                                        Your enquiry has been submitted. We will contact you soon.
                                    </div>
                                )}
                                <form className="enquiry-form" onSubmit={handleSubmit}>
                                    <div className="enquiry-form-row">
                                        <div className="enquiry-field">
                                            <label htmlFor="firstName">First Name</label>
                                            <input
                                                id="firstName"
                                                name="firstName"
                                                type="text"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="enquiry-field">
                                            <label htmlFor="lastName">Last Name</label>
                                            <input
                                                id="lastName"
                                                name="lastName"
                                                type="text"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="enquiry-form-row">
                                        <div className="enquiry-field">
                                            <label htmlFor="email">Email</label>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="enquiry-field">
                                            <label htmlFor="phone">Phone</label>
                                            <input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="enquiry-field">
                                        <label htmlFor="courseInterest">Course Interest</label>
                                        <input
                                            id="courseInterest"
                                            name="courseInterest"
                                            type="text"
                                            placeholder="e.g. B.Sc Computer Science"
                                            value={formData.courseInterest}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="enquiry-field">
                                        <label htmlFor="message">Message</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows={5}
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Tell us your questions about admissions, fees, scholarship, or programs."
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary enquiry-submit-btn">
                                        Submit Enquiry
                                    </button>
                                </form>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default EnrollNowPage;

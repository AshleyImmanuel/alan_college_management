import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './TermsPage.css';

const TermsPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="terms-page-wrapper">
            <Header />

            <div className="terms-hero">
                <div className="terms-hero-overlay"></div>
                <div className="terms-hero-content">
                    <h1>Terms &amp; Conditions</h1>
                    <p>Please review the following terms before proceeding with your enrollment.</p>
                </div>
            </div>

            <main className="terms-main">
                <div className="container">
                    <div className="terms-card">
                        <p className="terms-updated">Last Updated: February 1, 2026</p>

                        <section className="terms-section">
                            <h2>1. Acceptance of Terms</h2>
                            <p>By accessing and using Parker University's services, website, and enrollment portal, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.</p>
                        </section>

                        <section className="terms-section">
                            <h2>2. Eligibility</h2>
                            <p>To enroll at Parker University, applicants must:</p>
                            <ul>
                                <li>Be at least 17 years of age at the time of enrollment.</li>
                                <li>Have completed the required educational prerequisites for their chosen program.</li>
                                <li>Provide authentic and verifiable documentation as requested.</li>
                                <li>Meet the minimum academic requirements set forth by the respective department.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>3. Registration &amp; Account</h2>
                            <p>When creating an account on our portal, you agree to:</p>
                            <ul>
                                <li>Provide accurate, current, and complete information during registration.</li>
                                <li>Maintain the security of your password and account credentials.</li>
                                <li>Accept responsibility for all activities that occur under your account.</li>
                                <li>Notify the university immediately of any unauthorized use of your account.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>4. Tuition &amp; Fees</h2>
                            <p>All tuition fees, examination fees, and other charges are subject to the fee structure published by the university at the beginning of each academic year. Key policies include:</p>
                            <ul>
                                <li>Fees must be paid by the deadlines specified in the academic calendar.</li>
                                <li>Late payments may incur additional charges as determined by the administration.</li>
                                <li>Refund policies apply only within the specified withdrawal period.</li>
                                <li>Scholarships and financial aid are subject to separate terms and conditions.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>5. Academic Policies</h2>
                            <p>Students are expected to adhere to the following academic standards:</p>
                            <ul>
                                <li>Maintain a minimum GPA as required by their program.</li>
                                <li>Attend classes regularly and meet attendance requirements (minimum 75%).</li>
                                <li>Submit all assignments, projects, and examinations on time.</li>
                                <li>Uphold academic integrity — plagiarism and cheating are strictly prohibited and may result in expulsion.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>6. Code of Conduct</h2>
                            <p>All students must comply with Parker University's Code of Conduct, which includes but is not limited to:</p>
                            <ul>
                                <li>Respecting the rights, dignity, and property of fellow students, faculty, and staff.</li>
                                <li>Refraining from any form of harassment, discrimination, or bullying.</li>
                                <li>Complying with all campus safety regulations and emergency procedures.</li>
                                <li>Abstaining from the use of prohibited substances on campus premises.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>7. Intellectual Property</h2>
                            <p>All course materials, research publications, and content provided by Parker University are the intellectual property of the university. Students may not reproduce, distribute, or commercially use any university materials without prior written consent.</p>
                        </section>

                        <section className="terms-section">
                            <h2>8. Privacy Policy</h2>
                            <p>Parker University is committed to protecting your personal information. Data collected during registration and enrollment will be used solely for academic and administrative purposes. We do not share personal information with third parties unless required by law or with your explicit consent.</p>
                        </section>

                        <section className="terms-section">
                            <h2>9. Termination</h2>
                            <p>The university reserves the right to suspend or terminate a student's enrollment for:</p>
                            <ul>
                                <li>Violation of the Code of Conduct or academic integrity policies.</li>
                                <li>Failure to meet academic requirements after probationary period.</li>
                                <li>Non-payment of fees beyond the grace period.</li>
                                <li>Providing false or misleading information during admission.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>10. Amendments</h2>
                            <p>Parker University reserves the right to modify these Terms and Conditions at any time. Students will be notified of significant changes via their registered email address. Continued use of the university's services after modifications constitutes acceptance of the updated terms.</p>
                        </section>

                        <section className="terms-section">
                            <h2>11. Contact Information</h2>
                            <p>For questions regarding these Terms and Conditions, please contact:</p>
                            <div className="terms-contact">
                                <p><strong>Parker University — Office of Admissions</strong></p>
                                <p>Email: admissions@parker.edu</p>
                                <p>Phone: +1 (555) 123-4567</p>
                                <p>Address: 1234 University Avenue, Parker City, PC 56789</p>
                            </div>
                        </section>

                        <div className="terms-back">
                            <button
                                type="button"
                                className="terms-back-link"
                                onClick={() => {
                                    window.close();
                                    // Fallback if window.close() doesn't work (direct navigation)
                                    setTimeout(() => { window.location.href = '/login'; }, 300);
                                }}
                            >
                                <i className="fa-solid fa-arrow-left"></i> Back to Login / Registration
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TermsPage;

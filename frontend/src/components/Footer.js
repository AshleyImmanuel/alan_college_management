import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="container footer-inner">
                <div className="footer-col brand-col">
                    <img src="/logo.png" alt="Parker University Logo"
                        className="footer-logo" />
                    <p>A Subsidiary of Parker Group</p>
                    <p className="footer-tagline">LEARNERS TODAY, GLOBAL LEADERS TOMORROW</p>
                </div>
                <div className="footer-col contact-col">
                    <h4>Contact</h4>
                    <ul>
                        <li><i className="fa-solid fa-envelope"></i> info@parker.edu</li>
                        <li><i className="fa-solid fa-phone"></i> 01-4961764</li>
                        <li><i className="fa-solid fa-mobile-screen"></i> 01-4960180</li>
                        <li><i className="fa-solid fa-location-dot"></i> City Center, State</li>
                    </ul>
                </div>
                <div className="footer-col links-col">
                    <h4>Links</h4>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/about">Introduction</Link></li>
                        <li><Link to="/about">Parker In Pictures</Link></li>
                        <li><Link to="/about">News &amp; Events</Link></li>
                        <li><Link to="/enquiry-contact">Enquiry Contact</Link></li>
                    </ul>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

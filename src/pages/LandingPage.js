import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const LandingPage = () => {
    const testimonials = [
        {
            text: "It gives me immense pleasure to watch students learn, grow and achieve their milestones. I feel blessed to have an opportunity to work at Parker University. I am still growing and learning new things every single day.",
            author: "Dr. Sarah Jenkins",
            image: "https://picsum.photos/seed/testimonial1/400/400"
        },
        {
            text: "The practical approach to learning and the state-of-art facilities at Parker have fundamentally shaped my career. The faculty here doesn't just teach; they mentor you for the real world.",
            author: "Michael Chen, Class of '25",
            image: "https://picsum.photos/seed/testimonial2/400/400"
        },
        {
            text: "Finding a university that true balances academic rigor with moral grounding is rare. Parker exceeded my expectations, providing a community where integrity is as valued as intelligence.",
            author: "Elena Rodriguez",
            image: "https://picsum.photos/seed/testimonial3/400/400"
        },
        {
            text: "The diverse community at Parker University expanded my worldview. The vibrant student clubs and continuous support from the academic staff made my four years truly unforgettable.",
            author: "David Alaba",
            image: "https://picsum.photos/seed/testimonial4/400/400"
        },
        {
            text: "Parker provided me with the tools I needed to launch my tech startup right out of college. The incubation center and continuous industry networking opportunities were game changers.",
            author: "Sophia Martinez",
            image: "https://picsum.photos/seed/testimonial5/400/400"
        }
    ];

    const facilitiesData = [
        { title: "Co-Curricular Activities", img: "https://picsum.photos/seed/fac1/400/300" },
        { title: "Infirmary", img: "https://picsum.photos/seed/fac2/400/300" },
        { title: "Cafeteria", img: "https://picsum.photos/seed/fac3/400/300" },
        { title: "Library", img: "https://picsum.photos/seed/fac4/400/300" },
        { title: "Sports Complex", img: "https://picsum.photos/seed/fac5/400/300" },
        { title: "Innovation Labs", img: "https://picsum.photos/seed/fac6/400/300" }
    ];

    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    const nextTestimonial = useCallback(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, [testimonials.length]);

    // Auto-scroll logic
    useEffect(() => {
        const intervalId = setInterval(() => {
            nextTestimonial();
        }, 6000); // Change testimonial every 6 seconds

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, [nextTestimonial]);

    // Intersection Observer for the pixel formation effect
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('pixel-formed');
                } else {
                    // Remove when out of view so it forms again when it loops around
                    entry.target.classList.remove('pixel-formed');
                }
            });
        }, {
            root: null,
            rootMargin: '0px',
            threshold: 0.2 // Trigger when 20% visible
        });

        const cards = document.querySelectorAll('.facility-card');
        cards.forEach(card => observer.observe(card));

        return () => {
            cards.forEach(card => observer.unobserve(card));
        };
    }, [facilitiesData.length]); // Re-run if data length changes

    return (
        <div>
            <Header />

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="container hero-content">
                    <p className="hero-subtitle">COMBINE QUALITY WITH MORALITY</p>
                    <h1 className="hero-title">Welcome to<br />Parker University</h1>
                    <Link to="/enquiry-contact" className="btn btn-primary hero-btn">Enquiry Contact</Link>
                </div>
            </section>

            {/* 3-Column Features */}
            <section className="features-section">
                <div className="container">
                    <div className="features-grid">
                        <div className="feature-card">
                            <i className="fa-solid fa-child-reaching feature-icon"></i>
                            <h3>Undergraduate Programs</h3>
                            <p>For the all-round development of students, the university has an internal curriculum that helps
                                to enable the students to become confident and leaders of tomorrow.</p>
                        </div>
                        <div className="feature-card">
                            <i className="fa-solid fa-users-viewfinder feature-icon"></i>
                            <h3>Parker Students' Club</h3>
                            <p>To empower university students to build confidence, enhance skills, develop leadership, and
                                prepare for a successful future.</p>
                        </div>
                        <div className="feature-card">
                            <i className="fa-regular fa-gem feature-icon"></i>
                            <h3>Value Added Courses</h3>
                            <p>Parker University provides the students with innumerable opportunities which helps them grow and
                                strengthen the skills required for a changing world.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* School Facilities */}
            <section className="facilities-section">
                <div className="container text-center">
                    <h2 className="section-title">University Facilities</h2>
                    <p className="section-desc">For the overall development of our students, we provide numerous facilities and good
                        environment to our students.</p>

                    <div className="facilities-marquee-wrapper">
                        <div className="facilities-marquee-track">
                            {[...facilitiesData, ...facilitiesData].map((facility, index) => (
                                <div className="facility-card" key={index}>
                                    <div className="facility-img-wrapper">
                                        <div className="card-pixel-overlay">
                                            {[...Array(36)].map((_, i) => {
                                                // Random delay between 0s and 0.8s
                                                const delay = Math.random() * 0.8;
                                                return <div className="card-pixel-block" key={i} style={{ animationDelay: `${delay}s` }}></div>;
                                            })}
                                        </div>
                                        <img src={facility.img} alt={facility.title} />
                                    </div>
                                    <h4>{facility.title}</h4>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Link to="/about" className="btn btn-secondary view-all-btn">VIEW ALL</Link>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials-section">
                <div className="container text-center">
                    <h2 className="section-title">Testimonials</h2>
                    <div className="testimonial-container" key={currentTestimonial}>
                        <div className="testimonial-image">
                            <img src={testimonials[currentTestimonial].image}
                                alt="Testimonial Person" />
                        </div>
                        <div className="testimonial-content">
                            <p>"{testimonials[currentTestimonial].text}"</p>
                            <p style={{ marginTop: '10px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                - {testimonials[currentTestimonial].author}
                            </p>
                            <div className="nav-arrow" onClick={nextTestimonial} style={{ cursor: 'pointer' }}>
                                <i className="fa-solid fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* News & Events */}
            <section className="news-events-section">
                <div className="container text-center">
                    <h2 className="section-title">News & Events</h2>
                    <div className="news-grid">
                        <div className="news-card">
                            <img src="/news1.png" alt="Graduation Ceremony" />
                            <div className="news-content">
                                <h3>Graduation Ceremony 2026 - A Day of Pride, Joy & New Beginnings!</h3>
                                <p>A day filled with pride, joy, and heartfelt celebration! We...</p>
                                <Link to="/about" className="learn-more">Learn more</Link>
                                <p className="date">July 8, 2026</p>
                            </div>
                        </div>
                        <div className="news-card">
                            <img src="/news2.png" alt="Event" />
                            <div className="news-content">
                                <h3>Unveiling the 6th Edition of Parker Magazine: Our Spirit</h3>
                                <p>We are proud to announce the release of the 6th...</p>
                                <Link to="/about" className="learn-more">Learn more</Link>
                                <p className="date">April 8, 2026</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;

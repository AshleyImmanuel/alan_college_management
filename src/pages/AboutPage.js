import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AboutPage.css';

const AboutPage = () => {
    const statsRef = useRef(null);
    const countersStarted = useRef(false);

    // Animated counter effect
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersStarted.current) {
                    countersStarted.current = true;
                    const counters = entry.target.querySelectorAll('.stat-number');
                    counters.forEach(counter => {
                        const target = parseInt(counter.getAttribute('data-target'));
                        const suffix = counter.getAttribute('data-suffix') || '';
                        const duration = 2000;
                        const step = target / (duration / 16);
                        let current = 0;
                        const timer = setInterval(() => {
                            current += step;
                            if (current >= target) {
                                counter.textContent = target + suffix;
                                clearInterval(timer);
                            } else {
                                counter.textContent = Math.floor(current) + suffix;
                            }
                        }, 16);
                    });
                }
            });
        }, { threshold: 0.3 });

        if (statsRef.current) {
            observer.observe(statsRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Scroll-triggered fade-in animation
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('about-visible');
                }
            });
        }, { threshold: 0.15 });

        const elements = document.querySelectorAll('.about-animate');
        elements.forEach(el => observer.observe(el));

        return () => elements.forEach(el => observer.unobserve(el));
    }, []);

    return (
        <div className="about-page">
            <Header />

            {/* About Hero */}
            <section className="about-hero">
                <div className="about-hero-overlay"></div>
                <div className="container about-hero-content">
                    <p className="about-hero-tag">ABOUT PARKER UNIVERSITY</p>
                    <h1 className="about-hero-title">Shaping Minds,<br />Building Futures</h1>
                    <p className="about-hero-subtitle">
                        A legacy of academic excellence, innovation, and moral integrity since 1998.
                    </p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="about-mission-section">
                <div className="container">
                    <div className="about-mission-grid">
                        <div className="about-mission-card about-animate">
                            <div className="about-mission-icon">
                                <i className="fa-solid fa-bullseye"></i>
                            </div>
                            <h3>Our Mission</h3>
                            <p>To provide world-class education that nurtures intellectual curiosity, fosters critical thinking, and develops responsible citizens who contribute positively to society. We believe in combining quality with morality to produce leaders of tomorrow.</p>
                        </div>
                        <div className="about-mission-card about-animate">
                            <div className="about-mission-icon">
                                <i className="fa-solid fa-eye"></i>
                            </div>
                            <h3>Our Vision</h3>
                            <p>To become a globally recognized institution that sets the benchmark for holistic education, innovation, and social responsibility. We aspire to create an ecosystem where every student's potential is unlocked and channeled for the greater good.</p>
                        </div>
                        <div className="about-mission-card about-animate">
                            <div className="about-mission-icon">
                                <i className="fa-solid fa-heart"></i>
                            </div>
                            <h3>Our Values</h3>
                            <p>Integrity, excellence, inclusivity, and innovation form the cornerstone of everything we do. We cultivate an environment of mutual respect, empathy, and a relentless pursuit of knowledge that transcends classroom walls.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="about-story-section">
                <div className="container">
                    <div className="about-story-grid">
                        <div className="about-story-image about-animate">
                            <img src="https://picsum.photos/seed/parkercampus/800/600" alt="Parker University Campus" />
                            <div className="about-story-image-accent"></div>
                        </div>
                        <div className="about-story-content about-animate">
                            <p className="about-story-tag">OUR STORY</p>
                            <h2>A Legacy of <span className="about-highlight">Excellence</span></h2>
                            <p>Founded in 1998, Parker University began as a small college with a grand vision, to create a space where academic rigor meets moral grounding. What started with just 150 students has now blossomed into a thriving community of over 8,000 learners.</p>
                            <p>Over the past two decades, we have continuously evolved our curriculum, expanded our facilities, and strengthened our faculty to meet the demands of a rapidly changing world. Our graduates are making their mark across industries, from technology and healthcare to arts and public service.</p>
                            <p>Today, Parker University stands as a testament to the power of education done right, with heart, with purpose, and with an unshakable commitment to our founding principles.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="about-stats-section" ref={statsRef}>
                <div className="container">
                    <div className="about-stats-grid">
                        <div className="about-stat-item">
                            <span className="stat-number" data-target="25" data-suffix="+">0</span>
                            <span className="stat-label">Years of Excellence</span>
                        </div>
                        <div className="about-stat-item">
                            <span className="stat-number" data-target="8000" data-suffix="+">0</span>
                            <span className="stat-label">Students Enrolled</span>
                        </div>
                        <div className="about-stat-item">
                            <span className="stat-number" data-target="350" data-suffix="+">0</span>
                            <span className="stat-label">Faculty Members</span>
                        </div>
                        <div className="about-stat-item">
                            <span className="stat-number" data-target="50" data-suffix="+">0</span>
                            <span className="stat-label">Programs Offered</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Leadership */}
            <section className="about-leadership-section">
                <div className="container text-center">
                    <p className="about-section-tag about-animate">MEET OUR LEADERS</p>
                    <h2 className="section-title about-animate">University Leadership</h2>
                    <p className="section-desc about-animate">Guided by visionary leaders who are dedicated to shaping the future of education.</p>

                    <div className="about-leaders-grid">
                        <div className="about-leader-card about-animate">
                            <div className="about-leader-img-wrap">
                                <img src="https://picsum.photos/seed/chancellor/400/400" alt="Chancellor" />
                            </div>
                            <h4>Dr. James Parker</h4>
                            <p className="about-leader-role">Chancellor & Founder</p>
                            <p className="about-leader-desc">A visionary educator with over 35 years of experience in academia and institution building.</p>
                        </div>
                        <div className="about-leader-card about-animate">
                            <div className="about-leader-img-wrap">
                                <img src="https://picsum.photos/seed/vcparker/400/400" alt="Vice Chancellor" />
                            </div>
                            <h4>Dr. Emily Carter</h4>
                            <p className="about-leader-role">Vice Chancellor</p>
                            <p className="about-leader-desc">An accomplished researcher driving Parker's academic strategy and international collaborations.</p>
                        </div>
                        <div className="about-leader-card about-animate">
                            <div className="about-leader-img-wrap">
                                <img src="https://picsum.photos/seed/deanparker/400/400" alt="Dean of Studies" />
                            </div>
                            <h4>Prof. Robert Lin</h4>
                            <p className="about-leader-role">Dean of Studies</p>
                            <p className="about-leader-desc">A passionate advocate for student-centered learning and innovative pedagogical methods.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="about-cta-section">
                <div className="container text-center">
                    <h2 className="about-animate">Ready to Begin Your Journey?</h2>
                    <p className="about-animate">Join the Parker University community and transform your future with quality education rooted in strong values.</p>
                    <div className="about-cta-buttons about-animate">
                        <Link to="/enquiry-contact" className="btn btn-primary">Enquiry Contact</Link>
                        <Link to="/about" className="btn btn-secondary">Request Info</Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default AboutPage;

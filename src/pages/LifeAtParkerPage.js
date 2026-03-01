import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LifeAtParkerPage.css';

const introTags = ['Clubs', 'Sports', 'Mentorship', 'Culture', 'Innovation', 'Service'];

const introImages = [
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1464380573004-8ca85a08751a?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1000&q=80'
];

const dayFlow = [
    {
        time: '08:00 AM',
        title: 'Morning Practice',
        text: 'Students begin the day with sports drills, yoga, or fitness sessions.',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80'
    },
    {
        time: '11:30 AM',
        title: 'Studio Collaboration',
        text: 'Project teams meet in open studios to build, review, and iterate together.',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80'
    },
    {
        time: '04:00 PM',
        title: 'Club Blocks',
        text: 'Debate, music, coding, film, and social impact clubs run active meetups.',
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80'
    },
    {
        time: '07:00 PM',
        title: 'Campus Evenings',
        text: 'Open-mic nights, showcase rehearsals, and peer mentoring wrap up the day.',
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80'
    }
];

const communities = [
    {
        title: 'Student Parliament',
        text: 'Students represent campus voices and run policy and event initiatives.',
        image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=80'
    },
    {
        title: 'Makers Collective',
        text: 'Prototyping, hack sprints, and product showcases every month.',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80'
    },
    {
        title: 'Creative Arts Guild',
        text: 'Performance, photography, and media production communities.',
        image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=80'
    },
    {
        title: 'Service League',
        text: 'Volunteer drives, field projects, and local community partnerships.',
        image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=80'
    },
    {
        title: 'Wellness Circle',
        text: 'Physical and mental well-being sessions guided by campus mentors.',
        image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=1000&q=80'
    },
    {
        title: 'Career Pods',
        text: 'Small groups for resume labs, interview practice, and networking.',
        image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80'
    }
];

const gallery = [
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80'
];

const galleryClass = ['lap-gallery-tall', '', 'lap-gallery-wide', '', '', 'lap-gallery-tall', '', 'lap-gallery-wide'];

const fallbackByIndex = (index) => {
    if (index % 3 === 0) {
        return '/hero_bg.png';
    }
    if (index % 2 === 0) {
        return '/news2.png';
    }
    return '/news1.png';
};

const LifeAtParkerPage = () => {
    const setFallbackImage = (event, fallbackSrc) => {
        const img = event.currentTarget;
        if (img.dataset.fallbackApplied === 'true') {
            return;
        }
        img.dataset.fallbackApplied = 'true';
        img.src = fallbackSrc;
    };

    return (
        <div className="lap-page">
            <Header />

            <section className="lap-intro">
                <div className="lap-intro-overlay"></div>
                <div className="container lap-intro-content">
                    <p className="lap-eyebrow">LIFE AT PARKER</p>
                    <h1>More Than A Degree. A Full Campus Experience.</h1>
                    <p>
                        At Parker, classroom learning is only one part of student life. Clubs, sports,
                        mentorship, culture, and service create the environment where students grow with confidence.
                    </p>
                    <div className="lap-intro-actions">
                        <Link to="/enquiry-contact" className="btn btn-primary">Enquiry Contact</Link>
                        <Link to="/" className="btn btn-secondary">Explore Programs</Link>
                    </div>
                    <div className="lap-tag-row">
                        {introTags.map((tag) => (
                            <span key={tag}>{tag}</span>
                        ))}
                    </div>
                </div>

                <div className="container lap-ribbon-wrap">
                    <div className="lap-ribbon">
                        {introImages.map((image, index) => (
                            <figure className="lap-ribbon-card" key={`intro-${index}`}>
                                <img
                                    src={image}
                                    alt="Campus life at Parker"
                                    onError={(event) => setFallbackImage(event, fallbackByIndex(index))}
                                />
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            <section className="lap-dayflow">
                <div className="container lap-dayflow-grid">
                    <aside className="lap-dayflow-summary">
                        <p className="lap-section-tag">A DAY AT PARKER</p>
                        <h2>Campus Rhythm</h2>
                        <p>
                            Students move through a balanced day of academics, practice, collaboration,
                            and community-led experiences.
                        </p>
                        <ul>
                            <li><strong>40+</strong><span>Student clubs</span></li>
                            <li><strong>60+</strong><span>Events each year</span></li>
                            <li><strong>18</strong><span>Sports teams</span></li>
                        </ul>
                    </aside>

                    <div className="lap-dayflow-list">
                        {dayFlow.map((item, index) => (
                            <article className="lap-dayflow-card" key={item.time}>
                                <div className="lap-time-chip">{item.time}</div>
                                <div className="lap-dayflow-copy">
                                    <h3>{item.title}</h3>
                                    <p>{item.text}</p>
                                </div>
                                <div className="lap-dayflow-image">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        onError={(event) => setFallbackImage(event, fallbackByIndex(index))}
                                    />
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="lap-communities">
                <div className="container">
                    <p className="lap-section-tag">COMMUNITIES</p>
                    <h2 className="section-title">Find Your Circle</h2>
                    <p className="section-desc">
                        Every student finds a place to contribute, lead, and build strong relationships.
                    </p>
                    <div className="lap-community-grid">
                        {communities.map((item, index) => (
                            <article className="lap-community-card" key={item.title}>
                                <div className="lap-community-image">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        onError={(event) => setFallbackImage(event, fallbackByIndex(index))}
                                    />
                                </div>
                                <div className="lap-community-content">
                                    <h3>{item.title}</h3>
                                    <p>{item.text}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="lap-gallery">
                <div className="container">
                    <p className="lap-section-tag">CAMPUS SNAPSHOTS</p>
                    <h2 className="section-title">Inside Life At Parker</h2>
                </div>
                <div className="lap-marquee-container">
                    <div className="lap-marquee-track">
                        {[...gallery, ...gallery].map((image, index) => (
                            <figure
                                className="lap-marquee-item"
                                key={`marquee-1-${index}`}
                            >
                                <img
                                    src={image}
                                    alt="Parker campus life"
                                    onError={(event) => setFallbackImage(event, fallbackByIndex(index))}
                                />
                            </figure>
                        ))}
                    </div>
                    <div className="lap-marquee-track reverse">
                        {[...gallery, ...gallery].reverse().map((image, index) => (
                            <figure
                                className="lap-marquee-item"
                                key={`marquee-2-${index}`}
                            >
                                <img
                                    src={image}
                                    alt="Parker campus life"
                                    onError={(event) => setFallbackImage(event, fallbackByIndex(index))}
                                />
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            <section className="lap-cta">
                <div className="lap-cta-inner">
                    <div className="lap-cta-content">
                        <span className="lap-section-tag">READY TO JOIN?</span>
                        <h2>Build Your Student Story At Parker</h2>
                        <p>Join a campus where academics and student life are designed to grow together. Discover programs that challenge you and communities that support you.</p>
                        <Link to="/enquiry-contact" className="btn btn-primary">Enquiry Contact</Link>
                    </div>
                </div>
                <div className="lap-cta-image-wrapper">
                    <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80" alt="Students gathering on campus" />
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LifeAtParkerPage;

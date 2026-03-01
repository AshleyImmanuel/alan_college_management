import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './ArtsHumanitiesPage.css';

const highlights = [
    { label: 'Studios And Labs', value: '16' },
    { label: 'Student Exhibitions', value: '48+' },
    { label: 'Global Exchange Programs', value: '12' }
];

const pathways = [
    {
        icon: 'fa-solid fa-feather-pointed',
        title: 'Literature And Creative Writing',
        text: 'Narrative craft, poetry studios, publishing workflows, and editorial practice.'
    },
    {
        icon: 'fa-solid fa-landmark',
        title: 'History And Cultural Studies',
        text: 'Civilization studies, public history, archival practice, and social interpretation.'
    },
    {
        icon: 'fa-solid fa-masks-theater',
        title: 'Performing Arts',
        text: 'Acting, stage design, movement labs, and interdisciplinary production.'
    },
    {
        icon: 'fa-solid fa-camera-retro',
        title: 'Media, Film And Visual Culture',
        text: 'Cinematography basics, film criticism, visual storytelling, and digital media.'
    }
];

const studios = [
    {
        title: 'Story Lab',
        text: 'Writers, designers, and researchers co-create immersive story worlds and scripts.',
        tag: 'Narrative'
    },
    {
        title: 'Culture Atelier',
        text: 'A living studio for curation, museum practice, and public-facing exhibitions.',
        tag: 'Curation'
    },
    {
        title: 'Stagecraft Workshop',
        text: 'Performance projects from concept to lighting, costume, and final showcase.',
        tag: 'Production'
    }
];

const faculty = [
    {
        name: 'Dr. Mira Ellison',
        role: 'Professor, Comparative Literature',
        image: 'https://picsum.photos/seed/artsfaculty1/420/420'
    },
    {
        name: 'Prof. Karthik Dev',
        role: 'Associate Professor, Theatre Practice',
        image: 'https://picsum.photos/seed/artsfaculty2/420/420'
    },
    {
        name: 'Dr. Helena Brooks',
        role: 'Professor, Cultural History',
        image: 'https://picsum.photos/seed/artsfaculty3/420/420'
    },
    {
        name: 'Prof. Ana Rivera',
        role: 'Assistant Professor, Media Arts',
        image: 'https://picsum.photos/seed/artsfaculty4/420/420'
    }
];

const showcase = [
    { season: 'Spring Showcase', text: 'Original theatre productions and interdisciplinary installations.' },
    { season: 'Summer Field Studio', text: 'Community storytelling and heritage documentation projects.' },
    { season: 'Autumn Film Week', text: 'Student films, director talks, and visual criticism sessions.' },
    { season: 'Winter Review', text: 'Portfolio review, publication launch, and capstone exhibitions.' }
];

const ArtsHumanitiesPage = () => {
    return (
        <div className="ah-page">
            <Header />

            <section className="ah-hero">
                <div className="ah-hero-overlay"></div>
                <div className="container ah-hero-inner">
                    <div className="ah-hero-copy">
                        <p className="ah-tag">ACADEMICS / SCHOOL OF ARTS AND HUMANITIES</p>
                        <h1>Create Meaning. Interpret Culture. Shape Society.</h1>
                        <p>
                            The Arts and Humanities program blends critical inquiry with creative practice.
                            Students build portfolios, direct performances, publish writing, and design
                            cultural projects that matter in the real world.
                        </p>
                        <div className="ah-hero-actions">
                            <Link to="/enquiry-contact" className="btn btn-primary">Enquiry Contact</Link>
                            <Link to="/" className="btn btn-secondary">View Campus Life</Link>
                        </div>
                        <div className="ah-highlight-row">
                            {highlights.map((item) => (
                                <article key={item.label} className="ah-highlight-card">
                                    <strong>{item.value}</strong>
                                    <span>{item.label}</span>
                                </article>
                            ))}
                        </div>
                    </div>

                    <aside className="ah-composition">
                        <h3>Creative Composition Board</h3>
                        <div className="ah-composition-grid">
                            <article className="ah-swatch ah-swatch-1">
                                <span>Writing</span>
                            </article>
                            <article className="ah-swatch ah-swatch-2">
                                <span>Performance</span>
                            </article>
                            <article className="ah-swatch ah-swatch-3">
                                <span>History</span>
                            </article>
                            <article className="ah-swatch ah-swatch-4">
                                <span>Media</span>
                            </article>
                        </div>
                        <p>Next open studio critique: Thursday, 3:30 PM - Humanities Block Atrium.</p>
                    </aside>
                </div>
            </section>

            <section className="ah-pathways">
                <div className="container">
                    <h2 className="section-title">Academic Pathways</h2>
                    <p className="section-desc">
                        Specialized tracks designed to connect human-centered thinking with modern creative work.
                    </p>
                    <div className="ah-pathway-grid">
                        {pathways.map((item) => (
                            <article key={item.title} className="ah-pathway-card">
                                <i className={item.icon}></i>
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ah-studios">
                <div className="container">
                    <h2 className="section-title">Studios And Practice Spaces</h2>
                    <div className="ah-studio-grid">
                        {studios.map((studio) => (
                            <article key={studio.title} className="ah-studio-card">
                                <span className="ah-studio-tag">{studio.tag}</span>
                                <h3>{studio.title}</h3>
                                <p>{studio.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ah-showcase">
                <div className="container">
                    <h2 className="section-title">Annual Showcase Calendar</h2>
                    <div className="ah-showcase-grid">
                        {showcase.map((item) => (
                            <article key={item.season} className="ah-showcase-card">
                                <span>{item.season}</span>
                                <p>{item.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ah-faculty">
                <div className="container">
                    <h2 className="section-title">Faculty Collective</h2>
                    <div className="ah-faculty-grid">
                        {faculty.map((member) => (
                            <article key={member.name} className="ah-faculty-card">
                                <div className="ah-faculty-photo">
                                    <img src={member.image} alt={member.name} />
                                </div>
                                <h3>{member.name}</h3>
                                <p>{member.role}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ah-cta">
                <div className="container text-center">
                    <h2>Build A Portfolio With Purpose</h2>
                    <p>
                        Join a department where creativity, culture, and critical thinking work together.
                    </p>
                    <div className="ah-cta-actions">
                        <Link to="/about" className="btn btn-primary">Request Admission Guidance</Link>
                        <Link to="/academics/arts-humanities" className="btn btn-secondary">Download Program Brief</Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ArtsHumanitiesPage;

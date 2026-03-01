import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './BusinessAdministrationPage.css';

const programStats = [
    { label: 'Program Length', value: '4 Years' },
    { label: 'Annual Intake', value: '180' },
    { label: 'Live Projects', value: '36+' },
    { label: 'Internship Rate', value: '96%' }
];

const specializations = [
    {
        icon: 'fa-solid fa-chart-line',
        title: 'Finance And FinTech',
        description: 'Financial modeling, investment analysis, and digital finance product strategy.'
    },
    {
        icon: 'fa-solid fa-bullhorn',
        title: 'Marketing Strategy',
        description: 'Brand systems, digital growth, consumer behavior, and campaign analytics.'
    },
    {
        icon: 'fa-solid fa-people-group',
        title: 'Human Capital',
        description: 'Organization design, talent management, leadership development, and culture building.'
    },
    {
        icon: 'fa-solid fa-boxes-stacked',
        title: 'Operations And Supply Chain',
        description: 'Process optimization, procurement systems, and data-driven operational planning.'
    }
];

const pedagogy = [
    {
        title: 'Classroom Foundations',
        text: 'Core management, economics, accounting, and analytics with structured assessments.'
    },
    {
        title: 'Case Method Studios',
        text: 'Weekly discussion-led business cases focused on decisions, tradeoffs, and execution.'
    },
    {
        title: 'Consulting Labs',
        text: 'Student teams solve real business problems for startups and partner organizations.'
    },
    {
        title: 'Internship And Capstone',
        text: 'Industry immersion and final strategic project reviewed by faculty and mentors.'
    }
];

const faculty = [
    {
        name: 'Dr. Amelia Grant',
        role: 'Professor, Strategic Management',
        image: 'https://picsum.photos/seed/bafaculty1/420/420',
        area: 'Corporate Strategy, Governance'
    },
    {
        name: 'Prof. Rohan Menon',
        role: 'Associate Professor, Marketing',
        image: 'https://picsum.photos/seed/bafaculty2/420/420',
        area: 'Brand Analytics, Consumer Insights'
    },
    {
        name: 'Dr. Sofia Kim',
        role: 'Assistant Professor, Finance',
        image: 'https://picsum.photos/seed/bafaculty3/420/420',
        area: 'Portfolio Analysis, FinTech'
    },
    {
        name: 'Prof. Marcus Hale',
        role: 'Professor, Operations',
        image: 'https://picsum.photos/seed/bafaculty4/420/420',
        area: 'Process Excellence, Supply Systems'
    }
];

const recruiters = [
    'BluePeak Capital',
    'Northline Consulting',
    'Vertex Retail Group',
    'Summit Logistics',
    'Aquila FinTech',
    'CoreBridge Advisory'
];

const BusinessAdministrationPage = () => {
    return (
        <div className="ba-page">
            <Header />

            <section className="ba-hero">
                <div className="container ba-hero-inner">
                    <div className="ba-hero-copy">
                        <p className="ba-tag">ACADEMICS / SCHOOL OF MANAGEMENT</p>
                        <h1>Business Administration</h1>
                        <p>
                            Built for future managers, founders, and strategists. Learn to lead teams,
                            analyze markets, and make high-impact business decisions with confidence.
                        </p>
                        <div className="ba-hero-actions">
                            <Link to="/enquiry-contact" className="btn btn-primary">Enquiry Contact</Link>
                            <Link to="/" className="btn btn-secondary">View Campus Life</Link>
                        </div>
                    </div>

                    <aside className="ba-glance-card">
                        <h3>Program At A Glance</h3>
                        <ul>
                            {programStats.map((stat) => (
                                <li key={stat.label}>
                                    <span>{stat.label}</span>
                                    <strong>{stat.value}</strong>
                                </li>
                            ))}
                        </ul>
                        <p>Next orientation briefing: Tuesday, 11:30 AM - Management Block Hall.</p>
                    </aside>
                </div>
            </section>

            <section className="ba-specializations">
                <div className="container">
                    <h2 className="section-title">Specialization Pathways</h2>
                    <p className="section-desc">
                        Choose a pathway that matches your career direction while retaining a strong
                        management core.
                    </p>
                    <div className="ba-specialization-grid">
                        {specializations.map((item) => (
                            <article key={item.title} className="ba-specialization-card">
                                <i className={item.icon}></i>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ba-pedagogy">
                <div className="container">
                    <h2 className="section-title">How Learning Happens</h2>
                    <div className="ba-pedagogy-grid">
                        {pedagogy.map((step, index) => (
                            <article key={step.title} className="ba-step-card">
                                <span className="ba-step-number">0{index + 1}</span>
                                <h3>{step.title}</h3>
                                <p>{step.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ba-faculty">
                <div className="container">
                    <h2 className="section-title">Faculty Leadership</h2>
                    <p className="section-desc">
                        Learn from faculty with deep academic expertise and strong industry exposure.
                    </p>
                    <div className="ba-faculty-grid">
                        {faculty.map((member) => (
                            <article key={member.name} className="ba-faculty-card">
                                <div className="ba-faculty-photo">
                                    <img src={member.image} alt={member.name} />
                                </div>
                                <h3>{member.name}</h3>
                                <p className="ba-faculty-role">{member.role}</p>
                                <p className="ba-faculty-area">{member.area}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ba-recruiters">
                <div className="container">
                    <h2 className="section-title">Industry Recruiter Network</h2>
                    <div className="ba-recruiter-list">
                        {recruiters.map((name) => (
                            <span key={name}>{name}</span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ba-cta">
                <div className="container text-center">
                    <h2>Ready To Build Your Management Career?</h2>
                    <p>
                        Join a business program designed around strategy, execution, and measurable outcomes.
                    </p>
                    <div className="ba-cta-actions">
                        <Link to="/about" className="btn btn-primary">Request Admission Guidance</Link>
                        <Link to="/academics/business-administration" className="btn btn-secondary">Download Prospectus</Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default BusinessAdministrationPage;

import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './ComputerSciencePage.css';

const highlights = [
    {
        icon: 'fa-solid fa-terminal',
        title: 'Code-Intensive Studios',
        text: 'Every term includes an engineering studio where students ship production-style features.'
    },
    {
        icon: 'fa-solid fa-layer-group',
        title: 'Systems Thinking',
        text: 'Learn how software, infrastructure, and data pipelines interact under real workload constraints.'
    },
    {
        icon: 'fa-solid fa-microchip',
        title: 'Cloud And DevOps',
        text: 'Build, containerize, deploy, and monitor services with modern DevOps workflows.'
    },
    {
        icon: 'fa-solid fa-brain',
        title: 'AI Product Track',
        text: 'From model fundamentals to deployment, with emphasis on practical and explainable AI.'
    }
];

const tracks = [
    {
        title: 'Software Product Engineering',
        desc: 'Design scalable web platforms, APIs, and collaborative codebases.',
        tools: ['React', 'Node.js', 'System Design']
    },
    {
        title: 'Artificial Intelligence',
        desc: 'Build data-driven applications with model training and evaluation pipelines.',
        tools: ['Python', 'ML Workflows', 'MLOps']
    },
    {
        title: 'Cybersecurity',
        desc: 'Practice secure architecture, incident response, and defensive coding.',
        tools: ['Threat Modeling', 'Forensics', 'Secure Coding']
    }
];

const faculty = [
    {
        name: 'Dr. Priya Nair',
        role: 'Professor, Distributed Systems',
        office: 'CS Block B-214',
        image: 'https://picsum.photos/seed/csfaculty1/420/420',
        areas: ['Cloud Systems', 'Microservices', 'Scalability']
    },
    {
        name: 'Prof. Ethan Alvarez',
        role: 'Associate Professor, AI',
        office: 'Innovation Center A-112',
        image: 'https://picsum.photos/seed/csfaculty2/420/420',
        areas: ['Machine Learning', 'MLOps', 'Computer Vision']
    },
    {
        name: 'Dr. Kavya Raman',
        role: 'Assistant Professor, Cybersecurity',
        office: 'CS Block C-105',
        image: 'https://picsum.photos/seed/csfaculty3/420/420',
        areas: ['Network Defense', 'Secure Coding', 'Forensics']
    },
    {
        name: 'Prof. Daniel Okafor',
        role: 'Professor, Software Engineering',
        office: 'CS Block A-303',
        image: 'https://picsum.photos/seed/csfaculty4/420/420',
        areas: ['Architecture', 'DevOps', 'Product Engineering']
    }
];

const labs = [
    {
        title: 'Systems And Cloud Lab',
        text: 'A rack-backed lab where students practice container orchestration, observability, and CI/CD.',
        badge: '24x7 Sandbox'
    },
    {
        title: 'AI Computation Studio',
        text: 'GPU workstations with curated datasets for model training, inference optimization, and evaluation.',
        badge: 'GPU Enabled'
    },
    {
        title: 'Cyber Range Arena',
        text: 'Controlled security environment for attack simulation, incident response, and defensive hardening.',
        badge: 'Red vs Blue'
    }
];

const roadmap = [
    {
        label: 'Year 1',
        focus: 'Foundations',
        items: ['Programming Studio', 'Mathematics For CS', 'Digital Systems', 'Web Fundamentals']
    },
    {
        label: 'Year 2',
        focus: 'Core Build Skills',
        items: ['Data Structures', 'DBMS', 'Computer Networks', 'Object-Oriented Design']
    },
    {
        label: 'Year 3',
        focus: 'Specialization',
        items: ['AI / Cloud / Security Electives', 'Operating Systems', 'Software Engineering']
    },
    {
        label: 'Year 4',
        focus: 'Industry Transition',
        items: ['Capstone Product', 'Research Or Internship', 'Placement Readiness Sprint']
    }
];

const outcomes = [
    { label: 'Placement Assistance', value: '98%' },
    { label: 'Capstone Teams', value: '42' },
    { label: 'Industry Mentors', value: '65+' },
    { label: 'Student Startups', value: '12' }
];

const ComputerSciencePage = () => {
    return (
        <div className="cs-page">
            <Header />

            <section className="cs-hero">
                <div className="container cs-hero-inner">
                    <div className="cs-hero-copy">
                        <p className="cs-tag">ACADEMICS / DEPARTMENT OF COMPUTING</p>
                        <h1>Computer Science <span>Department</span></h1>
                        <p>
                            Build software that works in the real world. Our program blends strong
                            fundamentals, high-intensity labs, and mentored project execution.
                        </p>
                        <div className="cs-hero-actions">
                            <Link to="/enquiry-contact" className="btn btn-primary">Enquiry Contact</Link>
                            <Link to="/" className="btn btn-secondary">Explore Campus</Link>
                        </div>
                        <div className="cs-hero-metrics">
                            <article className="cs-hero-metric">
                                <strong>120</strong>
                                <span>Total Seats</span>
                            </article>
                            <article className="cs-hero-metric">
                                <strong>14+</strong>
                                <span>Lab Hours / Week</span>
                            </article>
                            <article className="cs-hero-metric">
                                <strong>4</strong>
                                <span>Specialization Tracks</span>
                            </article>
                        </div>
                    </div>
                    <aside className="cs-hero-panel">
                        <h3>2026 Intake Snapshot</h3>
                        <ul>
                            <li><span>Program Duration</span><strong>4 Years</strong></li>
                            <li><span>Total Seats</span><strong>120</strong></li>
                            <li><span>Lab Hours / Week</span><strong>14+</strong></li>
                            <li><span>Project Reviews</span><strong>Bi-weekly</strong></li>
                        </ul>
                        <div className="cs-terminal">
                            <div className="cs-terminal-top">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <code>cs-labs$ run capstone --batch=2026</code>
                        </div>
                        <p>Next faculty counseling: Friday, 4:00 PM - CS Seminar Hall.</p>
                    </aside>
                </div>
            </section>

            <section className="cs-outcomes-strip">
                <div className="container">
                    <div className="cs-outcomes-grid">
                        {outcomes.map((item) => (
                            <article key={item.label} className="cs-outcome-card">
                                <strong>{item.value}</strong>
                                <span>{item.label}</span>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cs-overview">
                <div className="container">
                    <div className="cs-overview-head">
                        <h2 className="section-title">Program DNA</h2>
                        <p className="section-desc">
                            Concept in class, implementation in lab, feedback in review clinics.
                            This is how we close the gap between academics and engineering practice.
                        </p>
                    </div>
                    <div className="cs-overview-panels">
                        <article className="cs-overview-item">
                            <h3>Build Every Semester</h3>
                            <p>
                                Students complete team products with architecture reviews, code quality checks,
                                and deployment rubrics.
                            </p>
                        </article>
                        <article className="cs-overview-item">
                            <h3>Mentor-Led Learning</h3>
                            <p>
                                Weekly office hours, guided debugging sessions, and project clinics with faculty.
                            </p>
                        </article>
                        <article className="cs-overview-item">
                            <h3>Industry Exposure</h3>
                            <p>
                                Guest sessions from product engineers and internships aligned to specialization tracks.
                            </p>
                        </article>
                        <article className="cs-overview-item">
                            <h3>Career Readiness</h3>
                            <p>
                                Mock interviews, resume labs, and open-source contribution pathways in final year.
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="cs-highlights">
                <div className="container">
                    <h2 className="section-title">Learning Architecture</h2>
                    <p className="section-desc">
                        The curriculum is structured as progressive layers, from first-year fundamentals to final-year product execution.
                    </p>
                    <div className="cs-highlights-grid">
                        {highlights.map((item) => (
                            <article key={item.title} className="cs-card">
                                <i className={item.icon}></i>
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cs-tracks">
                <div className="container">
                    <h2 className="section-title">Specialization Tracks</h2>
                    <div className="cs-tracks-grid">
                        {tracks.map((track) => (
                            <article key={track.title} className="cs-track-card">
                                <h3>{track.title}</h3>
                                <p>{track.desc}</p>
                                <div className="cs-track-tools">
                                    {track.tools.map((tool) => (
                                        <span key={tool}>{tool}</span>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cs-faculty">
                <div className="container">
                    <h2 className="section-title">Faculty And Mentors</h2>
                    <p className="section-desc">
                        Faculty with research depth and product-building experience guide every studio and capstone.
                    </p>
                    <div className="cs-faculty-grid">
                        {faculty.map((member) => (
                            <article key={member.name} className="cs-faculty-card">
                                <div className="cs-faculty-media">
                                    <img src={member.image} alt={member.name} />
                                </div>
                                <div className="cs-faculty-content">
                                    <h3>{member.name}</h3>
                                    <p className="cs-faculty-role">{member.role}</p>
                                    <p className="cs-faculty-office">{member.office}</p>
                                    <div className="cs-faculty-tags">
                                        {member.areas.map((area) => (
                                            <span key={area}>{area}</span>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cs-labs">
                <div className="container">
                    <h2 className="section-title">Labs And Practice Environments</h2>
                    <div className="cs-lab-grid">
                        {labs.map((lab) => (
                            <article key={lab.title} className="cs-lab-card">
                                <span className="cs-lab-badge">{lab.badge}</span>
                                <h3>{lab.title}</h3>
                                <p>{lab.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cs-roadmap">
                <div className="container">
                    <h2 className="section-title">Academic Roadmap</h2>
                    <div className="cs-roadmap-grid">
                        {roadmap.map((phase) => (
                            <article key={phase.label} className="cs-roadmap-card">
                                <p className="cs-roadmap-label">{phase.label}</p>
                                <h3>{phase.focus}</h3>
                                <ul>
                                    {phase.items.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cs-cta">
                <div className="container text-center">
                    <h2>Build, Ship, And Grow As An Engineer</h2>
                    <p>
                        Join a department designed around practical execution, expert mentorship,
                        and industry-aligned outcomes.
                    </p>
                    <div className="cs-cta-actions">
                        <Link to="/about" className="btn btn-primary">Request Admission Guidance</Link>
                        <Link to="/academics/computer-science" className="btn btn-secondary">Download Curriculum</Link>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default ComputerSciencePage;

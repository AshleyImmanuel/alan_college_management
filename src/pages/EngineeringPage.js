import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './EngineeringPage.css';

const heroStats = [
    { label: 'Workshops', value: '18' },
    { label: 'Labs', value: '12' },
    { label: 'Industry Partners', value: '40+' }
];

const controlMetrics = [
    { name: 'Practical Lab Exposure', percent: 92 },
    { name: 'Internship Readiness', percent: 88 },
    { name: 'Capstone Completion', percent: 95 }
];

const disciplines = [
    {
        icon: 'fa-solid fa-bolt',
        title: 'Electrical Engineering',
        text: 'Power systems, control networks, and smart grid applications.',
        code: 'EE-01'
    },
    {
        icon: 'fa-solid fa-gear',
        title: 'Mechanical Engineering',
        text: 'Design, manufacturing systems, thermodynamics, and automation.',
        code: 'ME-02'
    },
    {
        icon: 'fa-solid fa-building',
        title: 'Civil Engineering',
        text: 'Infrastructure planning, structural analysis, and sustainable construction.',
        code: 'CE-03'
    },
    {
        icon: 'fa-solid fa-microchip',
        title: 'Electronics Engineering',
        text: 'Embedded systems, VLSI foundations, and intelligent device design.',
        code: 'ECE-04'
    }
];

const labs = [
    {
        title: 'Advanced Manufacturing Lab',
        detail: 'CNC prototyping, rapid fabrication, and process optimization studios.',
        tag: 'Production'
    },
    {
        title: 'Power And Control Systems Lab',
        detail: 'Industrial control modules, automation circuits, and simulation benches.',
        tag: 'Automation'
    },
    {
        title: 'Materials And Structures Lab',
        detail: 'Stress testing, material characterization, and design validation workflows.',
        tag: 'Validation'
    }
];

const journey = [
    { stage: 'Year 1', text: 'Engineering mathematics, core physics, and design foundations.' },
    { stage: 'Year 2', text: 'Branch fundamentals, laboratory immersion, and technical communication.' },
    { stage: 'Year 3', text: 'Specialization electives, mini-projects, and industry exposure.' },
    { stage: 'Year 4', text: 'Capstone engineering project, internship, and placement preparation.' }
];

const designCycle = [
    {
        icon: 'fa-solid fa-compass-drafting',
        title: 'Design',
        text: 'Problem framing, CAD modeling, and engineering specification.'
    },
    {
        icon: 'fa-solid fa-screwdriver-wrench',
        title: 'Build',
        text: 'Prototype fabrication, instrumentation, and test integration.'
    },
    {
        icon: 'fa-solid fa-vials',
        title: 'Test',
        text: 'Performance validation, failure analysis, and iteration loops.'
    },
    {
        icon: 'fa-solid fa-rocket',
        title: 'Deploy',
        text: 'Field trials, reporting, and production readiness documentation.'
    }
];

const faculty = [
    {
        name: 'Dr. Alan Verma',
        role: 'Professor, Mechanical Systems',
        image: 'https://picsum.photos/seed/engfac1/420/420'
    },
    {
        name: 'Prof. Neha Iyer',
        role: 'Associate Professor, Electrical Networks',
        image: 'https://picsum.photos/seed/engfac2/420/420'
    },
    {
        name: 'Dr. Thomas Reed',
        role: 'Professor, Structural Engineering',
        image: 'https://picsum.photos/seed/engfac3/420/420'
    },
    {
        name: 'Prof. Arjun Das',
        role: 'Assistant Professor, Embedded Systems',
        image: 'https://picsum.photos/seed/engfac4/420/420'
    }
];

const EngineeringPage = () => {
    return (
        <div className="eng-page">
            <Header />

            <section className="eng-hero">
                <div className="eng-hero-overlay"></div>
                <div className="container eng-hero-inner">
                    <div className="eng-hero-copy">
                        <p className="eng-tag">ACADEMICS / ENGINEERING COMMAND CENTER</p>
                        <h1>Engineering School</h1>
                        <p>
                            Build, test, and solve at scale. The program combines core engineering theory
                            with high-intensity labs, field exposure, and production-grade capstone systems.
                        </p>
                        <div className="eng-hero-actions">
                            <Link to="/enquiry-contact" className="btn btn-primary">Enquiry Contact</Link>
                            <Link to="/" className="btn btn-secondary">Visit Workshops</Link>
                        </div>
                        <div className="eng-hero-stats">
                            {heroStats.map((stat) => (
                                <article key={stat.label} className="eng-stat-card">
                                    <strong>{stat.value}</strong>
                                    <span>{stat.label}</span>
                                </article>
                            ))}
                        </div>
                    </div>

                    <aside className="eng-panel">
                        <h3>Mission Control</h3>
                        {controlMetrics.map((item) => (
                            <div key={item.name} className="eng-meter-row">
                                <div className="eng-meter-head">
                                    <span>{item.name}</span>
                                    <strong>{item.percent}%</strong>
                                </div>
                                <div className="eng-meter-track">
                                    <span style={{ width: `${item.percent}%` }}></span>
                                </div>
                            </div>
                        ))}
                        <p>Next engineering design review: Monday, 10:00 AM - Innovation Auditorium.</p>
                    </aside>
                </div>
            </section>

            <section className="eng-disciplines">
                <div className="container">
                    <h2 className="section-title">Discipline Matrix</h2>
                    <p className="section-desc">
                        A strong multidisciplinary foundation with deep specialization options.
                    </p>
                    <div className="eng-discipline-grid">
                        {disciplines.map((item, idx) => (
                            <article key={item.title} className={`eng-discipline-card ${idx === 0 ? 'eng-discipline-card-featured' : ''}`}>
                                <span className="eng-discipline-code">{item.code}</span>
                                <i className={item.icon}></i>
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="eng-journey">
                <div className="container">
                    <p className="eng-journey-tag">Execution Blueprint</p>
                    <h2 className="section-title">Design To Deployment Journey</h2>
                    <p className="eng-journey-intro">
                        A clear pathway from engineering foundations to production-ready execution.
                    </p>
                    <div className="eng-journey-layout">
                        <div className="eng-journey-panel">
                            <div className="eng-journey-head">
                                <h3>Academic Roadmap</h3>
                                <span>4 Years</span>
                            </div>
                            <div className="eng-journey-grid">
                                {journey.map((item) => (
                                    <article key={item.stage} className="eng-journey-card">
                                        <span className="eng-journey-stage">{item.stage}</span>
                                        <p>{item.text}</p>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className="eng-cycle-panel">
                            <div className="eng-journey-head">
                                <h3>Engineering Delivery Cycle</h3>
                                <span>4 Stages</span>
                            </div>
                            <div className="eng-cycle-grid">
                                {designCycle.map((item, index) => (
                                    <article key={item.title} className="eng-cycle-card">
                                        <span className="eng-cycle-step">0{index + 1}</span>
                                        <i className={item.icon}></i>
                                        <div className="eng-cycle-copy">
                                            <h3>{item.title}</h3>
                                            <p>{item.text}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="eng-labs">
                <div className="container">
                    <h2 className="section-title">Labs And Facilities</h2>
                    <div className="eng-lab-grid">
                        {labs.map((lab) => (
                            <article key={lab.title} className="eng-lab-card">
                                <span className="eng-lab-tag">{lab.tag}</span>
                                <h3>{lab.title}</h3>
                                <p>{lab.detail}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="eng-faculty">
                <div className="container">
                    <h2 className="section-title">Faculty Command Team</h2>
                    <div className="eng-faculty-grid">
                        {faculty.map((member) => (
                            <article key={member.name} className="eng-faculty-card">
                                <div className="eng-faculty-photo">
                                    <img src={member.image} alt={member.name} />
                                </div>
                                <h3>{member.name}</h3>
                                <p>{member.role}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="eng-cta">
                <div className="container text-center">
                    <h2>Engineer Real-World Systems</h2>
                    <p>
                        Join an engineering ecosystem focused on rigorous fundamentals and real-world execution.
                    </p>
                    <div className="eng-cta-actions">
                        <Link to="/about" className="btn btn-primary">Request Admission Guidance</Link>
                        <Link to="/academics/engineering" className="btn btn-secondary">Download Program Outline</Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default EngineeringPage;

require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./models/Department');
const Course = require('./models/Course');

const seedDepartments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Seed CS Department
        let cs = await Department.findOne({ code: 'cs' });
        if (!cs) {
            cs = await Department.create({
                name: 'Computer Science',
                code: 'cs',
                icon: 'fa-laptop-code',
                color: '#3b82f6',
            });
            console.log('Created: Computer Science department');
        } else {
            console.log('Exists: Computer Science department');
        }

        // Seed courses
        const courses = [
            { name: 'B.Tech Computer Science', code: 'btech-cs', programType: 'ug', duration: 4 },
            { name: 'B.Sc Computer Science', code: 'bsc-cs', programType: 'ug', duration: 3 },
            { name: 'BCA', code: 'bca', programType: 'ug', duration: 3 },
            { name: 'M.Tech Computer Science', code: 'mtech-cs', programType: 'pg', duration: 2 },
            { name: 'M.Sc Computer Science', code: 'msc-cs', programType: 'pg', duration: 2 },
            { name: 'MCA', code: 'mca', programType: 'pg', duration: 2 },
        ];

        for (const c of courses) {
            const existing = await Course.findOne({ code: c.code });
            if (!existing) {
                await Course.create({ ...c, department: cs._id });
                console.log(`Created: ${c.name}`);
            } else {
                console.log(`Exists: ${c.name}`);
            }
        }

        console.log('\nSeed complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error.message);
        process.exit(1);
    }
};

seedDepartments();

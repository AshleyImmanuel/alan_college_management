const mongoose = require('mongoose');

const Class = require('./models/Class');

mongoose.connect('mongodb://127.0.0.1:27017/parker_university')
    .then(async () => {
        console.log('Connected to DB');

        // Find existing classes
        const classes = await Class.find({});
        for (const cls of classes) {
            console.log(`Checking class ${cls.name}... type of coursePlan:`, typeof cls.coursePlan);
            if (typeof cls.coursePlan === 'string' || cls.coursePlan === null) {
                console.log(`Migrating coursePlan for ${cls.name}`);
                await Class.collection.updateOne(
                    { _id: cls._id },
                    { $set: { coursePlan: { rawText: '', fileUrl: '', originalName: '' } } }
                );
            }
        }

        console.log('Migration complete');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

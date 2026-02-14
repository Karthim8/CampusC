const mongoose = require('mongoose');
require('dotenv').config();

async function clearUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            email: String
        }));

        await User.deleteMany({});
        console.log('All users cleared from database.');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

clearUsers();

const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            displayName: String,
            googleId: String,
            isVerified: Boolean,
            createdAt: Date
        }));

        const users = await User.find({});
        console.log('Total users:', users.length);
        users.forEach(u => {
            console.log(`- [${u.isVerified ? 'VERIFIED' : 'PENDING'}] Email: "${u.email}", Name: "${u.displayName}", Joined: ${u.createdAt || 'N/A'}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();

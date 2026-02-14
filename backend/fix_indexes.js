const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const collection = db.collection('users');

        console.log('Fetching current indexes...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        // Check if googleId_1 index exists
        const googleIdx = indexes.find(i => i.name === 'googleId_1');
        if (googleIdx) {
            console.log('Dropping existing googleId_1 index...');
            await collection.dropIndex('googleId_1');
            console.log('Index dropped successfully.');
        }

        console.log('Creating new sparse unique index on googleId...');
        await collection.createIndex({ googleId: 1 }, { unique: true, sparse: true });
        console.log('Sparse unique index created successfully.');

        console.log('Database index fix complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing indexes:', err);
        process.exit(1);
    }
}

fixIndexes();

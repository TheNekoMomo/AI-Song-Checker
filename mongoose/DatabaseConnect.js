const mongoose = require('mongoose');
const dbURI = process.env.MONGODB_URI;

async function ConnectToDatabase() {
    if (!dbURI) throw new Error('MONGODB_URI is not defined in environment variables.');

    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(dbURI, {});
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        throw new Error (`Failed to login to mongoose: ${error}`);
    }
    
}

module.exports = ConnectToDatabase;
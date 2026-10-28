import mongoose from 'mongoose';
import User from './models/User.js';

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/typemaster');
    console.log('✓ Connected to MongoDB\n');

    const users = await User.find({}, 'email username name role createdAt');
    
    if (users.length === 0) {
      console.log('No users found in database.');
      console.log('\nTo create an admin account:');
      console.log('1. Go to http://localhost:5174/admin');
      console.log('2. Click "Don\'t have an account? Create one"');
      console.log('3. Fill in the signup form and create an account');
      console.log('4. After signup, run this command to make them admin:\n');
      console.log('   mongo typemaster');
      console.log('   db.users.updateOne({ email: "your-email@example.com" }, { $set: { role: "admin" } })\n');
    } else {
      console.log(`Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (@${user.username})`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role || 'user'}`);
        console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}\n`);
      });
      
      console.log('To make a user admin, use MongoDB compass or CLI:');
      console.log('db.users.updateOne({ email: "user-email" }, { $set: { role: "admin" } })\n');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();

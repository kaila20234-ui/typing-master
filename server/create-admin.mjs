import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import { generateUserId } from './lib/idGenerator.js';

dotenv.config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/typemaster');
    console.log('✅ MongoDB connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.email);
      console.log('To create another admin, delete the existing one first.');
      process.exit(0);
    }

    // Generate unique userId
    let userId;
    let isUnique = false;
    while (!isUnique) {
      userId = generateUserId();
      const existingUserId = await User.findOne({ userId });
      if (!existingUserId) {
        isUnique = true;
      }
    }

    // Create admin user with default credentials
    const adminEmail = 'admin@typemaster.com';
    const adminPassword = 'Admin@123456';
    
    const adminUser = new User({
      userId,
      email: adminEmail,
      username: 'admin',
      name: 'System Administrator',
      password: adminPassword,
      role: 'admin',
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('\n⚠️  IMPORTANT: Please log in and change the password immediately!');
    console.log('\nYou can now log into the admin panel at: http://localhost:5174');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();

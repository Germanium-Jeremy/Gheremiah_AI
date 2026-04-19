import mongoose from 'mongoose';
import { User } from '../models/User';
import { hashPassword } from '../utils/crypto';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gheremiah-ai';

export default async function createAdminUser(email: string, password: string) {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email, role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            await mongoose.disconnect();
            return;
        }

        // Create admin user
        const passwordHash = await hashPassword(password);
        const admin = await User.create({
            email,
            passwordHash,
            subscriptionTier: 'enterprise',
            role: 'admin',
            isVerified: true,
        });

        console.log('Admin user created successfully:', {
            id: (admin._id as any).toString(),
            email: admin.email,
            role: admin.role,
        });
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    const email = process.env.ADMIN_EMAIL || 'admin@gheremiah.ai';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    createAdminUser(email, password);
}

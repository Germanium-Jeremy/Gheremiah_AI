import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
    email: string;
    passwordHash: string;
    subscriptionTier: 'free' | 'pro' | 'enterprise';
    role: 'user' | 'admin';
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    subscriptionTier: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });

// UserSchema.index({ email: 1 });

export const User = mongoose.model<IUserDocument>('User', UserSchema);

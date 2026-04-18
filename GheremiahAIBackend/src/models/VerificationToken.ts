import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationTokenDocument extends Document {
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

const VerificationTokenSchema = new Schema<IVerificationTokenDocument>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Index for cleanup of expired tokens
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken = mongoose.model<IVerificationTokenDocument>('VerificationToken', VerificationTokenSchema);

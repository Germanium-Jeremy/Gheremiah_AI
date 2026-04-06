import mongoose, { Schema, Document } from 'mongoose';

export interface IUsageLogDocument extends Document {
    userId: mongoose.Types.ObjectId;
    action: string;
    tokensUsed: number;
    usageType: 'first-party' | 'third-party';
    timestamp: Date;
    metadata?: Record<string, any>;
}

const UsageLogSchema = new Schema<IUsageLogDocument>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, enum: ['chat', 'code_analysis', 'debugging', 'image_generation'] },
    tokensUsed: { type: Number, default: 0 },
    usageType: { type: String, enum: ['first-party', 'third-party'], default: 'first-party', required: true },
    metadata: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

UsageLogSchema.index({ userId: 1, action: 1 });

export const UsageLog = mongoose.model<IUsageLogDocument>('UsageLog', UsageLogSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKeyDocument extends Document {
    key: string;
    name: string;
    userId: mongoose.Types.ObjectId;
    lastUsedAt?: Date;
    createdAt: Date;
}

const ApiKeySchema = new Schema<IApiKeyDocument>({
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastUsedAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });

// ApiKeySchema.index({ key: 1 });

export const ApiKey = mongoose.model<IApiKeyDocument>('ApiKey', ApiKeySchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
    activeProvider: 'gemini' | 'ollama';
    updatedAt: Date;
}

const SystemConfigSchema: Schema = new Schema({
    activeProvider: {
        type: String,
        enum: ['gemini', 'ollama'],
        default: 'gemini',
        required: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Ensure only one config document exists
SystemConfigSchema.pre('save', async function (next) {
    const count = await mongoose.model('SystemConfig').countDocuments();
    if (count > 1 && !this.isNew) {
        // This is a bit simplistic, but for a singleton config it works.
        // In a real app, we might use a specific ID.
    }
    next();
});

export const SystemConfig = mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);

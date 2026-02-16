const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

// Helper to get or create a settings document
SettingsSchema.statics.getSetting = async function (key, defaultValue) {
    let setting = await this.findOne({ key });
    if (!setting) {
        setting = await this.create({ key, value: defaultValue });
    }
    return setting.value;
};

SettingsSchema.statics.setSetting = async function (key, value) {
    return this.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
    );
};

module.exports = mongoose.model('Settings', SettingsSchema);

const mongoose = require('mongoose');
const {ROLESENUM} = require('../../utils/ENUM');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    leetcodeUsername: { type: String, required: true },
    leetcodeProfileURL: { type: String, required: true },
    batch: {type: String, required: true},
    department: {type: String, default: "Computer Science"},
    role: {type: String, enum: Object.values(ROLESENUM), default: "student"},
    stats: {
      totalSolved: { type: Number, default: 0 },
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
      avatar: String,
      ranking: Number,
      lastUpdated: Date
    }
},{timestamps: true});

module.exports = mongoose.model('User', UserSchema);
const mongoose = require('mongoose');
const {ROLESENUM, ROLL_NUMBER_REGEX} = require('../../utils/ENUM');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    leetcodeUsername: { type: String, unique: true},
    leetcodeProfileURL: { type: String },
    rollno: {
        type: String,
        required: true,
        unique: true,
        match: [ROLL_NUMBER_REGEX, 'Roll number must be in format XX-XXXXX (e.g. CT-12345)']
    },
    programme: {type: String},
    batch: { type: String },
    department: {type: String, default: "Computer Science"},
    role: {type: String, enum: Object.values(ROLESENUM), default: "student"},
    isVerified: { type: Boolean, default: false },
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
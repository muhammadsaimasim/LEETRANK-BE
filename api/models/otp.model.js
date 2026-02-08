const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        index: true 
    },
    otp: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['signup', 'forgot-password'], 
        required: true 
    },
    registrationData: {
        type: Object,
        default: null
    },
    verified: { 
        type: Boolean, 
        default: false 
    },
    resetToken: {
        type: String,
        default: null
    },
    expiresAt: { 
        type: Date, 
        required: true, 
        index: { expires: 0 } // TTL index - MongoDB auto-deletes expired docs
    }
}, { timestamps: true });

module.exports = mongoose.model('OTP', OTPSchema);

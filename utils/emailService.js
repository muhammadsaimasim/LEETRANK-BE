const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send OTP email
 * @param {string} to - Recipient email
 * @param {string} otp - The OTP code
 * @param {string} type - 'signup' | 'forgot-password'
 */
const sendOTPEmail = async (to, otp, type) => {
    const subjects = {
        'signup': 'LeetRank - Verify Your Email',
        'forgot-password': 'LeetRank - Reset Your Password',
    };

    const messages = {
        // 'signup': `
        //     <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb;">
        //         <h2 style="color: #111; margin-bottom: 8px;">Welcome to LeetRank! 🚀</h2>
        //         <p style="color: #6b7280; font-size: 14px;">Use the code below to verify your email and complete registration.</p>
        //         <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
        //             <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${otp}</span>
        //         </div>
        //         <p style="color: #6b7280; font-size: 13px;">This code expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.</p>
        //     </div>
        // `,
        // 'forgot-password': `
        //     <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb;">
        //         <h2 style="color: #111; margin-bottom: 8px;">Reset Your Password 🔐</h2>
        //         <p style="color: #6b7280; font-size: 14px;">Use the code below to reset your password.</p>
        //         <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
        //             <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${otp}</span>
        //         </div>
        //         <p style="color: #6b7280; font-size: 13px;">This code expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.</p>
        //     </div>
        // `,
        'signup': `
                <div style="
                    background: #0b0f19;
                    padding: 40px 16px;
                    font-family: Inter, Arial, sans-serif;
                ">
                    <div style="
                        max-width: 520px;
                        margin: 0 auto;
                        background: radial-gradient(circle at top, #111827 0%, #020617 70%);
                        border-radius: 16px;
                        padding: 32px;
                        border: 1px solid #1f2933;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                    ">
                        <!-- Logo / Brand -->
                        <h1 style="
                            margin: 0 0 8px 0;
                            font-size: 22px;
                            font-weight: 700;
                            color: #f97316;
                            letter-spacing: 0.5px;
                        ">
                            &lt;/&gt; LeetRank
                        </h1>

                        <p style="
                            margin: 0 0 24px 0;
                            color: #9ca3af;
                            font-size: 14px;
                        ">
                            Compete. Code. Climb.
                        </p>

                        <!-- Message -->
                        <h2 style="
                            color: #e5e7eb;
                            font-size: 18px;
                            margin-bottom: 8px;
                        ">
                            Verify your email 🚀
                        </h2>

                        <p style="
                            color: #9ca3af;
                            font-size: 14px;
                            line-height: 1.6;
                        ">
                            Use the OTP below to complete your LeetRank signup.
                        </p>

                        <!-- OTP Box -->
                        <div style="
                            margin: 32px 0;
                            padding: 20px;
                            text-align: center;
                            background: #020617;
                            border: 1px dashed #f97316;
                            border-radius: 12px;
                        ">
                            <span style="
                                font-size: 34px;
                                font-weight: 700;
                                letter-spacing: 10px;
                                color: #f97316;
                                font-family: 'Courier New', monospace;
                            ">
                                ${otp}
                            </span>
                        </div>

                        <!-- Footer -->
                        <p style="
                            color: #9ca3af;
                            font-size: 13px;
                            line-height: 1.5;
                        ">
                            This code expires in <strong style="color:#e5e7eb;">10 minutes</strong>.
                            If you didn’t request this, you can safely ignore this email.
                        </p>

                        <div style="
                            margin-top: 32px;
                            padding-top: 16px;
                            border-top: 1px solid #1f2933;
                            font-size: 12px;
                            color: #6b7280;
                        ">
                            © ${new Date().getFullYear()} LeetRank • Built for competitive coders
                        </div>
                    </div>
                </div>
                `,
        'forgot-password':`
                <div style="
                    background: #0b0f19;
                    padding: 40px 16px;
                    font-family: Inter, Arial, sans-serif;
                ">
                    <div style="
                        max-width: 520px;
                        margin: 0 auto;
                        background: radial-gradient(circle at top, #111827 0%, #020617 70%);
                        border-radius: 16px;
                        padding: 32px;
                        border: 1px solid #1f2933;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                    ">
                        <!-- Logo / Brand -->
                        <h1 style="
                            margin: 0 0 8px 0;
                            font-size: 22px;
                            font-weight: 700;
                            color: #f97316;
                            letter-spacing: 0.5px;
                        ">
                            &lt;/&gt; LeetRank
                        </h1>

                        <p style="
                            margin: 0 0 24px 0;
                            color: #9ca3af;
                            font-size: 14px;
                        ">
                            Compete. Code. Climb.
                        </p>

                        <!-- Message -->
                        <h2 style="
                            color: #e5e7eb;
                            font-size: 18px;
                            margin-bottom: 8px;
                        ">
                            Reset you password 🚀
                        </h2>

                        <p style="
                            color: #9ca3af;
                            font-size: 14px;
                            line-height: 1.6;
                        ">
                            Use the OTP below to change your password.
                        </p>

                        <!-- OTP Box -->
                        <div style="
                            margin: 32px 0;
                            padding: 20px;
                            text-align: center;
                            background: #020617;
                            border: 1px dashed #f97316;
                            border-radius: 12px;
                        ">
                            <span style="
                                font-size: 34px;
                                font-weight: 700;
                                letter-spacing: 10px;
                                color: #f97316;
                                font-family: 'Courier New', monospace;
                            ">
                                ${otp}
                            </span>
                        </div>

                        <!-- Footer -->
                        <p style="
                            color: #9ca3af;
                            font-size: 13px;
                            line-height: 1.5;
                        ">
                            This code expires in <strong style="color:#e5e7eb;">10 minutes</strong>.
                            If you didn’t request this, you can safely ignore this email.
                        </p>

                        <div style="
                            margin-top: 32px;
                            padding-top: 16px;
                            border-top: 1px solid #1f2933;
                            font-size: 12px;
                            color: #6b7280;
                        ">
                            © ${new Date().getFullYear()} LeetRank • Built for competitive coders
                        </div>
                    </div>
                </div>
                `

    };

    const mailOptions = {
        from: `"LeetRank" <${process.env.SMTP_USER}>`,
        to,
        subject: subjects[type] || 'LeetRank - OTP Verification',
        html: messages[type] || messages['signup'],
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };

const ROLESENUM = {
    STUDENT: "student",
    ADMIN: "admin"
}

const ALLOWED_EMAIL_DOMAIN = "@cloud.neduet.edu.pk";

const ROLL_NUMBER_REGEX = /^(CT|AI|DS|CR|GA)-\d{5}$/;

const ROLL_NUMBER_PREFIXES = ["CT", "AI", "DS", "CR", "GA"];

// Programme is selected by the user and is NOT derived from the roll number prefix.
const PROGRAMMES = [
    "BSCS",
    "BSCS (AI)",
    "BSCS (CR)",
    "BSCS (DS)",
    "BSCS (GA)"
];

module.exports = {
    ROLESENUM,
    ALLOWED_EMAIL_DOMAIN,
    ROLL_NUMBER_REGEX,
    ROLL_NUMBER_PREFIXES,
    PROGRAMMES,
}
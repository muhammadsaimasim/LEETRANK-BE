const ROLESENUM = {
    STUDENT: "student",
    ADMIN: "admin"
}

const ALLOWED_EMAIL_DOMAIN = "@cloud.neduet.edu.pk";

const ROLL_NUMBER_REGEX = /^(CT|AI|DS|CR|GA)-\d{5}$/;

const ROLL_NUMBER_PREFIXES = ["CT", "AI", "DS", "CR", "GA"];

const PROGRAMME_MAP = {
    CT: "BS CS",
    AI: "BS CS (AI)",
    DS: "BS CS (DS)",
    CR: "BS CS (CR)",
    GA: "BS CS (GA)",
};

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
    PROGRAMME_MAP,
    PROGRAMMES,
}
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const date = require('date-and-time');


const generateToken = (data) => {
    return jwt.sign(
        data,
        process.env.JWT_TOKEN_KEY,
        { expiresIn: process.env.JWT_EXPIRE_TIME }
    );
}

const comparePassword = async (hashpassword, password) => {
    let comaprepassword = await argon2.verify(hashpassword, password);
    return comaprepassword
}

const generateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
}

const compareOTPs = (otp1, otp2) => {
    // Check if the OTPs are the same length.
    if (otp1.length !== otp2.length) {
        return false;
    }
    // Check if each character in the OTPs is the same.
    for (let i = 0; i < otp1.length; i++) {
        if (otp1[i] !== otp2[i]) {
            return false;
        }
    }
    // If all the characters in the OTPs are the same, return true.
    return true;
}

const compareTimeRange = (datetime, validity) => {
    const otpTimestamp = new Date(datetime);

    // Current time
    const currentTime = new Date();

    // Calculate the time difference in milliseconds
    const timeDifference = currentTime - otpTimestamp;

    // Validity period for OTP (5 minutes)
    const validityPeriod = parseInt(validity) * 60 * 1000; // 5 minutes in milliseconds

    // Check if the timestamp is valid for OTP verification
    if (timeDifference <= validityPeriod) {
        // console.log("OTP is valid.");
        return true;
    } else {
        // console.log("OTP has expired.");
        return false;
    }
}

const generateAlphanumericToken = (lengthtoken) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const numbers = '0123456789';
    const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    // Ensure at least one alphabet is present
    let token = alphabets.charAt(Math.floor(Math.random() * alphabets.length));

    for (let i = 1; i < lengthtoken; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    token = token.split('').sort(() => 0.5 - Math.random()).join('');

    return token;
}

const generateRefreshToken = (data) => {
    const refreshToken = jwt.sign(
        data,
        process.env.REFRESH_PRIVATE_KEY,
        { expiresIn: process.env.REFRESH_EXPIRE_TIME }
    );
    return refreshToken;
}

const generateAccessToken = (data) => {
    const accessToken = jwt.sign(
        data,
        process.env.ACCESS_PRIVATE_KEY,
        { expiresIn: process.env.ACCESS_EXPIRE_TIME }
    );
    return accessToken;
}

module.exports = { generateToken, comparePassword, generateOtp, compareOTPs, compareTimeRange, generateAlphanumericToken, generateRefreshToken, generateAccessToken }
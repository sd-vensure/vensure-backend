const isIndianMobileNumber = (number) => {
    // Check if length is 10 and if it contains only digits
    const isTenDigits = number ? number.length === 10 : false;
    const isDigitsOnly = number ? /^\d+$/.test(number) : false;

    // Validate if it starts with digits between 6 and 9 (common for Indian mobile numbers)
    const isValidStart = number ? /^[6-9]/.test(number) : false;

    return isTenDigits && isDigitsOnly && isValidStart;
}

const isValidEmail = (email) => {
    // Regular expression for validating an email address
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email ? emailPattern.test(email) : false;
}

module.exports = { isIndianMobileNumber, isValidEmail }
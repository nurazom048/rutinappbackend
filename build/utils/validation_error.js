"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationError = void 0;
const handleValidationError = (res, error) => {
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err) => err.message);
        res.status(400).send({ message: 'Validation failed: ' + errors.join(', ') });
        return true;
    }
    return false;
};
exports.handleValidationError = handleValidationError;

exports.handleValidationError = (res, error) => {
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        res.status(400).send({ message: 'Validation failed: ' + errors.join(', ') });
        return true;
    }
    return false;
}
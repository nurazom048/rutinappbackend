
const jwt = require('jsonwebtoken');

exports.generateAuthToken = (userId, username) => {
    const token = jwt.sign({ id: userId, username: username }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
    return token;
};

exports.generateRefreshToken = (userId, username) => {
    const token = jwt.sign({ id: userId, username: username }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '2d' });
    return token;
};

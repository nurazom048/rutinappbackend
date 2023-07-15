const jwt = require('jsonwebtoken');
const { generateAuthToken, generateRefreshToken } = require('./controllers/Auth/helper/Jwt.helper');
require('dotenv').config();

const verifyToken = async (req, res, next) => {
  try {
    // console.log("req.headers.authorization")
    // console.log(req.headers)
    const tokenArray = req.headers.authorization.split(' ');
    const token = tokenArray[tokenArray.length - 1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;

    // Check if the token is expired
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      // Token has expired

      // Verify the refresh token
      const refreshToken = req.headers['x-refresh-token'];
      const refreshDecoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      if (refreshDecoded.exp < Math.floor(Date.now() / 1000)) {
        // Refresh token has also expired
        return res.status(401).json({ message: 'Token has expired Please login again.' });
      }

      // Generate new token
      const newToken = await generateAuthToken(refreshDecoded.userId, refreshDecoded.username);
      // Set the new token in the response header
      res.setHeader('Authorization', `Bearer ${newToken}`);
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Auth failed. Please login again.' });
  }
};

module.exports = verifyToken;














// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// module.exports = (req, res, next) => {
//   try {
//     const token = req.headers.authorization.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
//     //console.log(decoded)

//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({
//       message: 'Auth failed Login again'
//     });
//   }
// };

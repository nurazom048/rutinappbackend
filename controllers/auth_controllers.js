const Account = require('../models/Account')
var jwt = require('jsonwebtoken');



const prisma = require('../prisma/index')




// login 

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Find user by username
    const user = await prisma.accounts.findUnique({
      where: {
        username: username,
      },
      // include: {
      //   routines: {
      //     select: {
      //       name: true,
      //       ownerid: true,
      //       class: {
      //         select: {
      //           id: true,
      //           name: true
      //         }
      //       }
      //     }
      //   }
      // },
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare passwords
    if (password !== user.password) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Create a JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, "secret", { expiresIn: "1d" });

    // Send response with token and user data
    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in" });
  }
};




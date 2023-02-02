const Account = require('../models/Account')
var jwt = require('jsonwebtoken');






//..... creat 

exports.createAccount = async (req, res)=> {
  const { name, username, password } = req.body
 
 
 
  try {


    const existingUser = await Account.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already exists" });

    // Create a new account
    const account = new Account({ name, username, password });
    const created = await account.save();
    // Send response
    res.status(200).json({ message: "Account created successfully", created });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating account" });
  }

}






// login 
exports.login = async (req, res) => {
    const { username, password } = req.params;
    console.log(req.body.password);
    try {

      if (!username) return res.status(400).json({ message: "req send error usernamw", username,password });

      // Find user by username
      const user = await Account.findOne({ username }).populate({ 
        path: 'routines', 
        select: 'name ownerid class',
        populate: {
          path: 'class',
          model: 'Class'
        }
      });
      if (!user) return res.status(400).json({ message: "user id not found", username,password });
  
      // Compare passwords
      if (password != user.password) return res.status(400).json({ message: "Invalid credentials" });
  
      // Create a JWT token
      const token = jwt.sign({ id: user._id }, "secret", { expiresIn: "1d" });
  
      // Send response with token
      res.status(200).json({ message: "Login successful", token ,user });
   
   
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error logging in" });
    }
  }
  

  exports.deleteAccount = async (req, res) => {
    const { id } = req.params;

    try {
       console.log(req.user);
      const findAccount = await Account.findById(id);
      if (!findAccount) return res.status(400).json({ message: "Account not found" });
     if(findAccount.id,toString() !== req.user.id) return res.status( " you can only delete your  Account "   )
      // Send response 
      console.log(findAccount._id);
     
     // findAccount.delete();
      res.status(200).json({ message: "Account deleted successfully" });


    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting account" });
    }
    };
    
    
    
    
    
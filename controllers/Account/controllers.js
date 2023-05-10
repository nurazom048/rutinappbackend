
const prisma = require('../../prisma/index')

//..... createAccount..........// 
exports.createAccount = async (req, res) => {
    const { name, username, password } = req.body;

    try {
        // Validation
        if (!name || !username || !password) return res.status(500).json({ message: "All fields are required" });


        // Check if the username is already taken
        const existingAccount = await prisma.account.findFirst({
            where: {
                username: username,
            },
        });

        if (existingAccount) return res.status(500).json({ message: "Username already taken" });


        // Create the new account
        const createdAccount = await prisma.account.create({
            data: {
                name,
                username,
                password,
            },
        });

        // Send response
        res.status(200).json({ message: "Account created successfully", createdAccount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};



//..... createAccount..........// 
exports.deleteAccount = async (req, res) => {
    const { id } = req.params;

    try {
        // Find the account by ID
        const findAccount = await prisma.account.findUnique({
            where: {
                id: id,
            },
        });

        if (!findAccount) {
            return res.status(400).json({ message: "Account not found" });
        }

        // // Check if the account belongs to the authenticated user
        // if (!req.user || findAccount.id.toString() !== req.user.id) {
        //   return res.status(401).json({ message: "You can only delete your own account" });
        // }

        // Delete the account
        await prisma.account.delete({
            where: {
                id: id,
            },
        });

        // Send response
        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting account" });
    }
};

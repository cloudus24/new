exports.checkAccess = async (req, res, next) => {
    try {
        const key = req.body.key || req.query.key || req.headers.key; // Get key from body, query, or headers
        console.log('key :>> ', key);
        
        if (key) {
            if (key === process.env.KEY) { // Compare the key with the one in environment variables
                return next(); // Call next middleware/controller
            } else {
                return res.status(401).json({ message: "Unauthorized access!" });
            }
        } else {
            return res.status(401).json({ message: "Unauthorized access!" });
        }
    } catch (error) {
        console.error('Error in checkAccess:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

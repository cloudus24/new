exports.checkAccess = async (req, res, next) => {
    try {
        const key = req.body.key || req.query.key || req.headers.key
        console.log('key :>> ', key);
        if (key) {
            if (key === process.env.KEY) {
                next()
            } else {
                return res.status(401).json({ message: "unauthorized access !!" });
            }
        } else {
            return res.status(401).json({ message: "unauthorized access !!" });
        }

    } catch (error) {
        return res.status(500).json({ message: "unauthorized access !!" });
    }
}
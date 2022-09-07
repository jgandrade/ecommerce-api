const jwt = require('jsonwebtoken');
const secret = 'testbookingapi';
const refreshSecret = 'testbookingapi2';

// DURING LOG-IN PHASE
module.exports.createWebToken = (user) => {
    const data = {
        id: user._id,
        emailAddress: user.emailAddress,
        isAdmin: user.isAdmin
    }

    return jwt.sign(data, secret, {});
}

// FOR MIDDLEWARE
module.exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== undefined) {
        let checkHeader = authHeader.split(" ")[1];
        return jwt.verify(checkHeader, refreshSecret, (err, data) => {
            if (err) return res.send({ auth: "Invalid token" })
            else next();
        })
    } else {
        res.send({ message: "Auth failed! No token provided" });
    }
}

// REFRESH TOKEN DURING LOGGED-IN PHASE
module.exports.generateAccessToken = user => {
    const data = {
        id: user._id,
        emailAddress: user.emailAddress,
        isAdmin: user.isAdmin
    }
    return jwt.sign(data, refreshSecret, {})
}

// DECODES TO USE PAYLOAD
module.exports.decode = token => {
    if (token !== undefined) {
        let jwtToken = token.split(" ")[1];
        return jwt.verify(jwtToken, secret, (err, data) => {
            let dataObject = jwt.decode(jwtToken, { complete: true }).payload;
            console.log("payload: " + dataObject);
            if (err) return null;
            else return jwt.decode(jwtToken, { complete: true }).payload;
        })
    } else {
        return null
    }
}
const User = require('../models/User');
const stringMethods = require('./stringMethods');
const bcrypt = require("bcrypt");
const auth = require("../auth");

// REGISTRATION OF USER HERE
module.exports.register = (req, res) => {
    User.find({ emailAddress: req.body.emailAddress })
        .then(result => {
            if (result.length === 0) {
                let errors = [];
                let registerUser = new User({
                    fullName: stringMethods.capitalizeName(req.body.fullName),
                    emailAddress: stringMethods.validateEmail(req.body.emailAddress) ? req.body.emailAddress : errors.push({ message: "Please provide a valid email address", response: false }),
                    mobileNumber: stringMethods.validateNumber(req.body.mobileNumber) ? req.body.mobileNumber : errors.push({ message: "Please provide a valid phone number", validFormat: "11 digit number / +<area code> 10 digit number", response: false }),
                    password: bcrypt.hashSync(req.body.password, 10)
                })

                if (errors.length > 0) {
                    return res.send({ message: "There was an error with the inputs", response: false, errors: errors });
                } else {
                    return registerUser.save()
                        .then(userSaved => res.send({ message: "User has been registered", response: true }))
                }
            } else {
                return res.send({ message: "Duplicate Email Found. Please use another one", response: false })
            }
        })
        .catch(err => res.send({ message: err.message, response: false }));
}

// LOGIN USER
module.exports.login = (req, res) => {
    let emailAddress = stringMethods.validateEmail(req.body.emailAddress);
    if (emailAddress) {
        User.findOne({ emailAddress: req.body.emailAddress })
            .then((result) => {
                if (result) {
                    const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);
                    if (isPasswordCorrect) {
                        let accessToken = auth.createWebToken(result);
                    
                        User.updateOne({ emailAddress: result.emailAddress }, { $push: { authTokens: [accessToken] } })
                            .then(result => { console.log(result); return true }).catch(err => { console.log(err); return false });

                        return res.send({ accessToken: accessToken, response: true, status: "logged-in" });
                        
                    } else {
                        return res.send({ error: "Password is incorrect", response: false });
                    }
                } else {
                    return res.send({ message: "Email does not exist", response: false });
                }
            }).catch(err => res.send({ message: err, response: false }));
    } else {
        return res.send({ message: "Invalid Email Address Format", response: false });
    }
}

module.exports.logout = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    console.log(userData);
    return res.send("Logged Out");
}

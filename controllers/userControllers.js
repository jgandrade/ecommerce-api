const Product = require('../models/Product');
const User = require('../models/User');
const stringMethods = require('./stringMethods');
const bcrypt = require("bcrypt");
const auth = require("../auth");
/*

    *****************          USER CART PROFILE CONTROLLERS             ************************

*/
module.exports.addToCart = async (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    let product = await Product.findById(req.body.productId)
        .then(result => result)

    let cartData = {
        productId: product.id,
        quantity: req.body.quantity
    }

    User.findById(userData.id)
        .then(user => {
            let indexExist;
            let isProductExist
            if (user.userCart.length > 0) {
                isProductExist = user.userCart.map((e, i) => {
                    if (product.id === e.productId) {
                        indexExist = i
                        return true;
                    } else {
                        return false;
                    }
                });
            } else {
                isProductExist = false;
            }

            if (isProductExist) {
                user.userCart[indexExist].quantity += req.body.quantity;
                return user.save()
                    .then(result => res.send({ message: "Cart updated", response: true }))
                    .catch(err => res.send({ message: "Error updating Cart", error: err, response: false }));
            } else {
                user.userCart.push(cartData);
                return user.save()
                    .then(result => res.send({ message: "Added to Cart", response: true }))
                    .catch(err => res.send({ message: "Error adding to Cart", error: err, response: false }));
            }
        });
}

/*

    *****************          USER PROFILE CONTROLLERS             ************************

*/
module.exports.changeName = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    User.findByIdAndUpdate(userData.id, { fullName: stringMethods.capitalizeName(req.body.fullName) }, { new: true })
        .then(changeName => {
            return res.send({ message: 'Updated', nameUpdatedTo: changeName.fullName, response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Name', response: false }));
}

// IMPROVE ALGO OF THIS
module.exports.changeEmail = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    User.findByIdAndUpdate(userData.id, { emailAddress: req.body.emailAddress }, { new: true })
        .then(changeEmail => {
            return res.send({ message: 'Updated', emailUpdatedTo: changeEmail.emailAddress, response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Email', response: false }));
}

// IMPROVE ALGO OF THIS
module.exports.changePassword = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    User.findByIdAndUpdate(userData.id, { password: bcrypt.hashSync(req.body.password, 10) }, { new: true })
        .then(changeEmail => {
            return res.send({ message: 'Updated', passwordUpdatedTo: "**********", response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Password', response: false }));
}

module.exports.changeNumber = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    User.findByIdAndUpdate(userData.id, { mobileNumber: req.body.mobileNumber }, { new: true })
        .then(changeNumber => {
            return res.send({ message: 'Updated', numberUpdatedTo: changeNumber.mobileNumber, response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Email', response: false }));
}
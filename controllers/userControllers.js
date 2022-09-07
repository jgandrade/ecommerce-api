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
        .catch(err => ({ message: "No Product Id Found", error: err }));

    let cartData; // Declare cartData

    // Check if there is a body 
    if (req.body.productId == null) {
        return res.send({ message: "Error Product Id not defined", response: false });
    } else {
        cartData = {
            productId: product.id,
            productName: product.productName,
            quantity: req.body.quantity
        }
    }

    User.findById(userData.id)
        .then(user => {

            let indexExist;
            let isProductExist = []; // INITIALIZE ARRAY OF TRUTHS

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
            if (isProductExist.length > 0) {
                isProductExist = isProductExist.some(e => e == true);
            } else {
                isProductExist = false;
            }

            if (isProductExist) {
                user.userCart[indexExist].quantity += req.body.quantity;
                return user.save()
                    .then(result => res.send({ message: "Cart updated", response: true }))
                    .catch(err => res.send({ message: "Error updating Cart", error: err, response: false }));
            } else {
                if (product.productStocks - req.body.quantity <= 0) {
                    return res.send({ message: `No available stocks left or quantity exceeded remaining stocks. Remaining Stocks if checkedOut: ${product.productStocks - req.body.quantity}`, response: false });
                }
                user.userCart.push(cartData);
                return user.save()
                    .then(result => res.send({ message: "Added to Cart", response: true }))
                    .catch(err => res.send({ message: "Error adding to Cart", error: err, response: false }));
            }
        })
        .catch(err => res.send({ message: "User ID Not Found", error: err, response: false }))
}

module.exports.checkOut = async (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    User.findById(userData.id)
        .then(user => {
            let isAddressExist = user.addresses.length > 0;
            let isCartNotEmpty = user.userCart.length > 0
            let address = user.addresses[user.defaultAddress];

            // STRINGIFY ADDRESS ARRAY OF OBJECTS INTO ONE
            address = stringMethods.capitalizeName(`${address.street} ${address.city} ${address.state} ${address.zip} ${address.country}`);

            if (isAddressExist && isCartNotEmpty) {
                let toCheckOutArr = user.userCart.filter(e => e.isReadyToCheckOut === true);
                toCheckOutArr.forEach(e => {
                    let cartNumber = e.cartNumber;
                    user.userOrders.push({
                        productId: e.productId,
                        quantity: e.quantity,
                        productName: e.productName,
                        address: address
                    });

                    let cartIndexToRemove; // GET THE INDEX TO BE DELETED IN CART

                    user.userCart.forEach((el, i) => {
                        if (el.cartNumber === cartNumber) {
                            cartIndexToRemove = i;
                        }
                    });

                    user.userCart.splice(cartIndexToRemove, 1); // DELETE FROM CART
                })

                user.save()
                    .then(result => {
                        user.userOrders.forEach(e => {
                            Product.findById(e.productId)
                                .then(product => {
                                    product.productOrders.push({
                                        orderId: e.orderId,
                                        userId: userData.id,
                                        billingName: user.fullName,
                                        billingAddress: address,
                                    });

                                    product.productStocks -= e.quantity;

                                    product.save().then(result => result).catch(err => err);
                                })
                                .catch(err => err);
                        });

                        return res.send({ message: "Checkout Successful", response: true });
                    })
                    .catch(err => res.send({ message: "Error Checking out", error: err, response: false }));

            } else {
                return res.send({ message: "Please add Address to your account or place a product on your Cart", error: { address: isAddressExist, cart: isCartNotEmpty }, response: false });
            }
        }).catch(err => {
            return res.send({ message: err, response: false })
        }
        )
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
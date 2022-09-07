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
    // Check if there is a body 
    if (req.body.productId == null) {
        return res.send({ message: "Error Product Id not defined", response: false });
    }

    let product = await Product.findById(req.body.productId)
        .then(result => result)
        .catch(err => ({ message: "No Product Id Found", error: err }));

    let cartData = {
        productId: product.id,
        productName: product.productName,
        totalPrice: product.productPrice * req.body.quantity,
        quantity: req.body.quantity
    }

    return User.findById(userData.id)
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

            // Check if Product Exist or Not
            if (isProductExist.length > 0) {
                isProductExist = isProductExist.some(e => e == true);
            } else {
                isProductExist = false;
            }

            // Do if Product Exist
            if (isProductExist) {
                user.userCart[indexExist].quantity += req.body.quantity;
                user.userCart[indexExist].totalPrice += cartData.totalPrice;
                return user.save()
                    .then(result => res.send({ message: "Cart updated", response: true }))
                    .catch(err => res.send({ message: "Error updating Cart", error: err, response: false }));
            } else {
                if (product.productStocks - req.body.quantity < 0) {
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

module.exports.modifyCartQuantity = async (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    User.findById(userData.id)
        .then(user => { 
            
        })
}

module.exports.checkOut = async (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findById(userData.id)
        .then(user => {
            let isAddressExist = user.addresses.length > 0;
            let isCartNotEmpty = user.userCart.length > 0

            if (isAddressExist && isCartNotEmpty) {
                let address = user.addresses[user.defaultAddress];

                // STRINGIFY ADDRESS ARRAY OF OBJECTS INTO ONE
                address = stringMethods.capitalizeName(`${address.street} ${address.city} ${address.state} ${address.zip} ${address.country}`);

                let toCheckOutArr = user.userCart.filter(e => e.isReadyToCheckOut === true);
                toCheckOutArr.forEach(e => {
                    let cartNumber = e.cartNumber;
                    user.userOrders.push({
                        productId: e.productId,
                        quantity: e.quantity,
                        productName: e.productName,
                        totalPrice: e.totalPrice,
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
                        let errors = [];
                        let userOrders = [...user.userOrders];
                        userOrders.forEach((e, i) => {
                            Product.findById(e.productId)
                                .then(product => {
                                    if (product.productStocks >= e.quantity) {
                                        product.productOrders.push({
                                            orderId: e.orderId,
                                            userId: userData.id,
                                            quantity: e.quantity,
                                            billingName: user.fullName,
                                            billingAddress: address,
                                            totalPrice: e.totalPrice
                                        });
                                        product.productStocks -= e.quantity;
                                        product.save().then(result => result).catch(err => err);
                                    } else {
                                        errors.push({ message: `User Order Quantity of ${user.userOrders[i].quantity} is greater than stocks of product. Your order will now be deleted. Please order another one.` })
                                        user.userOrders.splice(i, 1);
                                        user.save().then(result => result).catch(err => err);
                                    }
                                })
                                .catch(err => err);
                        });

                        return res.send({ message: "Checkout Successful", errors: errors, response: true });
                    })
                    .catch(err => res.send({ message: "Error Checking out", error: err, response: false }));
            } else {
                return res.send({ message: "Please add Address to your account or place a product on your Cart", error: { address: isAddressExist, cart: isCartNotEmpty }, response: false });
            }
        }).catch(err => {
            return res.send({ message: "User data not found in token", response: false });
        });
}

/*
 
    *****************          USER PROFILE CONTROLLERS             ************************
 
*/

module.exports.getUserProfile = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findById(userData.id)
        .then(user => res.send({ userProfile: { ...user._doc, password: "******" }, response: true, message: "Profile retrieved" }))
        .catch(err => res.send({ message: "User Data not acquired in Token", response: false, error: err.message }));
}

module.exports.changeName = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findByIdAndUpdate(userData.id, { fullName: stringMethods.capitalizeName(req.body.fullName) }, { new: true })
        .then(changeName => {
            return res.send({ message: 'Updated', nameUpdatedTo: changeName.fullName, response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Name', response: false }));
}

// IMPROVE ALGO OF THIS
module.exports.changeEmail = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findByIdAndUpdate(userData.id, { emailAddress: req.body.emailAddress }, { new: true })
        .then(changeEmail => {
            return res.send({ message: 'Updated', emailUpdatedTo: changeEmail.emailAddress, response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Email', response: false }));
}

// IMPROVE ALGO OF THIS
module.exports.changePassword = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findByIdAndUpdate(userData.id, { password: bcrypt.hashSync(req.body.password, 10) }, { new: true })
        .then(changeEmail => {
            return res.send({ message: 'Updated', passwordUpdatedTo: "**********", response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Password', response: false }));
}

module.exports.changeNumber = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findByIdAndUpdate(userData.id, { mobileNumber: req.body.mobileNumber }, { new: true })
        .then(changeNumber => {
            return res.send({ message: 'Updated', numberUpdatedTo: changeNumber.mobileNumber, response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Email', response: false }));
}
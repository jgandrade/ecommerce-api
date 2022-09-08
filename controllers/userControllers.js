const Product = require('../models/Product');
const User = require('../models/User');
const stringMethods = require('./stringMethods');
const bcrypt = require("bcrypt");
const auth = require("../auth");

/*

    *****************          USER CART PROFILE CONTROLLERS             ************************

*/
// ADD TO CART 
/*
ADDS A PRODUCT TO USER CART
body:
    productId: productId_here
    quantity:  user_define_quantity
*/
module.exports.addToCart = async (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    // Check if there is a body 
    if (req.body.productId == null) {
        return res.send({ message: "Error Product Id not defined", response: false });
    }

    let product = await Product.findById(req.body.productId)
        .then(result => result)
        .catch(err => res.send({ message: "No Product Id Found", error: err, response: false }));


    let cartData = {
        productId: product.id,
        productName: product.productName,
        totalPrice: product.productPrice * req.body.quantity,
        quantity: req.body.quantity
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

// MODIFY CART QUANTITY 
/*
MODIFIES USER CART QUANTITY
body:
    quantity: user_define_quantity
    cartNumber: cartNumber_here
*/
module.exports.modifyCartQuantity = async (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findById(userData.id)
        .then(user => {
            user.userCart.forEach((e, i) => {
                if (e.cartNumber === req.body.cartNumber) {
                    let originalPrice = user.userCart[i].totalPrice / user.userCart[i].quantity;
                    user.userCart[i].quantity = req.body.quantity;
                    user.userCart[i].totalPrice = originalPrice * req.body.quantity;

                    return user.save()
                        .then(result => res.send({ message: "Updated", response: true }))
                        .catch(err => res.send({ message: "Not Updated", response: false }));
                } else {
                    if (i === user.userCart.length - 1) {
                        return res.send({ message: "Not Updated. Cart Number provided does not exist in the current user.", response: false })
                    }
                }
            });
        })
}

module.exports.modifyReadyToCheckOutCart = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findById(userData.id)
        .then(user => {
            user.userCart.forEach((e, i) => {
                if (e.cartNumber === req.body.cartNumber) {
                    user.userCart[i].isReadyToCheckOut = !user.userCart[i].isReadyToCheckOut;

                    return user.save()
                        .then(result => res.send({ message: "Updated", response: true }))
                        .catch(err => res.send({ message: "Not Updated", response: false }));
                } else {
                    if (i === user.userCart.length - 1) {
                        return res.send({ message: "Not Updated. Cart Number provided does not exist in the current user.", response: false })
                    }
                }
            });
        })
}

module.exports.deleteCart = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    User.findById(userData.id)
        .then(user => {
            let cart = [...user.userCart];
            console.log(cart)
            cart.map((e, i) => {
                console.log(e.cartNumber)
                if (e.cartNumber === req.body.cartNumber) {
                    user.userCart.splice(i, 1);
                    user.save()
                        .then(result => res.send({ message: "Cart Deleted", response: true }))
                        .catch(err => res.send({ message: "Not Deleted", response: false }));
                } else {
                    return res.send({ message: "Cartnumber provided does not exist in user cart.", response: false })
                }
            });
        })
        .catch(err => res.send({ message: err.message, response: false }));
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
                    user.userOrders.push({
                        productId: e.productId,
                        quantity: e.quantity,
                        productName: e.productName,
                        totalPrice: e.totalPrice,
                        address: address
                    });


                })

                let checkOutArrLength = toCheckOutArr.length;

                user.save()
                    .then(result => {
                        let userOrders = [...user.userOrders];
                        let newUserOrders = [];
                        for (let i = userOrders.length - checkOutArrLength; i < userOrders.length; i++) {
                            newUserOrders.push(userOrders[i]);
                        }
                        let errors = [];
                        let success = [];
                        newUserOrders.forEach((e, i) => {
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

                                        let cartNumber = e.cartNumber;
                                        let cartIndexToRemove; // GET THE INDEX TO BE DELETED IN CART

                                        user.userCart.forEach((el, i) => {
                                            if (el.cartNumber === cartNumber) {
                                                cartIndexToRemove = i;
                                            }
                                        });

                                        user.userCart.splice(cartIndexToRemove, 1); // DELETE FROM CART

                                        product.save().then(result => result).catch(err => err);
                                        user.save().then(result => result).catch(err => err);
                                        success.push({ successOnProductId: e.productId });

                                    } else {
                                        user.userOrders.splice(userOrders.length - checkOutArrLength + i, 1);
                                        user.save().then(result => result).catch(err => err);
                                        errors.push({ errorOnProductId: e.productId });
                                    }

                                    if (errors.length > 0 && success.length == 0) {
                                        return res.send({ message: "Error placing order", errors: errors, response: false });
                                    }
                                    if (errors.length > 0 && success.length > 0) {
                                        return res.send({ message: "Some had errors placing order", success: success, errors: errors, response: true });
                                    }
                                    if (errors.length == 0 && success.length > 0) {
                                        return res.send({ message: "Successful Placing All Orders", success: success, response: true });
                                    }
                                })
                                .catch(err => err);
                        });
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

module.exports.changeEmail = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findByIdAndUpdate(userData.id, { emailAddress: req.body.emailAddress }, { new: true })
        .then(changeEmail => {
            return res.send({ message: 'Updated', emailUpdatedTo: changeEmail.emailAddress, response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Email', response: false }));
}

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

module.exports.updateAddress = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findById(userData.id)
        .then(user => {

            if (user.addresses.length > 0) {
                user.addresses[0].street = stringMethods.capitalizeName(req.body.street);
                user.addresses[0].city = stringMethods.capitalizeName(req.body.city);
                user.addresses[0].state = stringMethods.capitalizeName(req.body.state);
                user.addresses[0].zip = req.body.zip;
                user.addresses[0].country = stringMethods.capitalizeName(req.body.country);
                user.save().then(result => result).catch(err => res.send({ message: 'Not Updated', error: err, response: false }));
                return res.send({ message: 'Updated', response: true });
            } else {
                user.addresses.push({
                    street: stringMethods.capitalizeName(req.body.street),
                    city: stringMethods.capitalizeName(req.body.city),
                    state: stringMethods.capitalizeName(req.body.state),
                    zip: req.body.zip,
                    country: stringMethods.capitalizeName(req.body.country)
                })
                user.save().then(result => result).catch(err => res.send({ message: 'Not Updated', error: err, response: false }));
                return res.send({ message: 'Updated', response: true });
            }
        }
        )
        .catch(err => res.send({ message: 'Failed to Update', response: false }));
}

module.exports.toggleUserAdmin = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    if (userData.isAdmin) {
        return User.findById(req.body.userId)
            .then(user => {
                user.isAdmin = !user.isAdmin;
                return user.save()
                    .then(result => res.send({ message: "Updated", isAdmin: `${user.isAdmin}`, response: true }))
                    .catch(err => res.send({ message: "Not Updated", response: false }));
            })
    } else {
        return res.send({ message: "You are not allowed to do this task.", response: false })
    }
}
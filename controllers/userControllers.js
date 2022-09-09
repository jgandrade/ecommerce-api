const Product = require('../models/Product');
const User = require('../models/User');
const stringMethods = require('./stringMethods');
const bcrypt = require("bcrypt");
const auth = require("../auth");
const e = require('cors');

/*

    *****************          USER CART PROFILE CONTROLLERS             ************************

*/

/*ADD TO CART
    DESCRIPTION: Add to user cart 
    ROLES THAT CAN ACCESS: users
    METHOD: post
    URI: user/addToCart
    BODY:
        {
            productId: string,
            quantity: number
        }
*/
module.exports.addToCart = async (req, res) => {
    const userData = auth.decode(req.headers.authorization);

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

/*MODIFY CART QUANTITY
    DESCRIPTION: Modify cart quantity and change price 
    ROLES THAT CAN ACCESS: users
    METHOD: patch
    URI: user/cart/updateQuantity
    BODY:
        {
            cartNumber: string,
            quantity: number
        }
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

/*DELETE CART
    DESCRIPTION: Delete Cart
    ROLES THAT CAN ACCESS: users
    METHOD: delete
    URI: user/cart/delete
    BODY:
        {
            cartNumber: string,
        }
*/
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

/*Checkout from Cart
    DESCRIPTION: Check out Cart that is ready for checkout
    ROLES THAT CAN ACCESS: users
    METHOD: post
    URI: user/checkout
    JUST CLICK 
*/
module.exports.checkOut = async (req, res) => {
    const userData = auth.decode(req.headers.authorization);

    let user = await User.findById(userData.id).then(results => results);

    let productIds = user.userCart.map(e => e.productId).reverse();

    if (user.userCart.length == 0) {
        return res.send({ message: "Add something on your cart to checkout" });
    }
    
    let address;
    if (user.addresses.length > 0) {
        address = user.addresses[0];
        address = stringMethods.capitalizeName(`${address.street} ${address.city} ${address.state} ${address.zip} ${address.country}`);
    } else {
        return res.send({ message: "Enter an address before doing checkout" });
    }

    let dataToPush = user.userCart.map(e => {
        return {
            productId: e.productId,
            quantity: e.quantity,
            productName: e.productName,
            totalPrice: e.totalPrice,
            address: address
        }
    });

    dataToPush.forEach(e => {
        user.userOrders.unshift(e);
    })

    let success = [];
    let errors = [];

    for (let i = productIds.length-1; i >= 0; i--) {
        let product = await Product.findById(productIds[i]).then(results => results);

        let arrayToPushProduct = {
            orderId: user.userOrders[i].orderId,
            userId: userData.id,
            quantity: user.userOrders[i].quantity,
            billingName: user.fullName,
            billingAddress: user.userOrders[i].address,
            totalPrice: user.userOrders[i].totalPrice
        };

        if (product.productStocks >= user.userOrders[i].quantity) {
            product.productStocks = product.productStocks - user.userOrders[i].quantity;
            product.productOrders.push(arrayToPushProduct);
            success.push({ message: "Success", orderId: user.userOrders[i].orderId, orderName: product.productName });
            user.userCart.shift();
        } else {
            errors.push({ message: "Change quantity of user cart. See cart details on your cart." })
            user.userOrders.splice(i, 1);
            continue;
        }

        product.save().then(result => result);
    }

    user.save().then(result => result);

    return res.send({ success: success, errors: errors, response: true });
}

/*
 
    *****************          USER PROFILE CONTROLLERS             ************************
 
*/

/*Get user profile 
    DESCRIPTION: Get user profile 
    ROLES THAT CAN ACCESS: users
    METHOD: get
    URI: user/profile
*/
module.exports.getUserProfile = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findById(userData.id)
        .then(user => res.send({ userProfile: { ...user._doc, password: "******" }, response: true, message: "Profile retrieved" }))
        .catch(err => res.send({ message: "User Data not acquired in Token", response: false, error: err.message }));
}

/*CHANGE NAME 
    DESCRIPTION: Change user name
    ROLES THAT CAN ACCESS: users
    METHOD: patch
    URI: user/name/set
    BODY:
        {
            fullName: string,
        }
*/
module.exports.changeName = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findByIdAndUpdate(userData.id, { fullName: stringMethods.capitalizeName(req.body.fullName) }, { new: true })
        .then(changeName => {
            return res.send({ message: 'Updated', nameUpdatedTo: changeName.fullName, response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Name', response: false }));
}


/*CHANGE EMAIL 
    DESCRIPTION: Change email
    ROLES THAT CAN ACCESS: users
    METHOD: patch
    URI: user/email/set
    BODY:
        {
            emailAddress: string,
        }
*/
module.exports.changeEmail = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findByIdAndUpdate(userData.id, { emailAddress: req.body.emailAddress }, { new: true })
        .then(changeEmail => {
            return res.send({ message: 'Updated', emailUpdatedTo: changeEmail.emailAddress, response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Email', response: false }));
}


/*CHANGE PASSWORD
    DESCRIPTION: Change password
    ROLES THAT CAN ACCESS: users
    METHOD: patch
    URI: user/password/set
    BODY:
        {
            password: string,
        }
*/
module.exports.changePassword = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findByIdAndUpdate(userData.id, { password: bcrypt.hashSync(req.body.password, 10) }, { new: true })
        .then(changeEmail => {
            return res.send({ message: 'Updated', passwordUpdatedTo: "**********", response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Password', response: false }));
}


/*CHANGE NUMBER
    DESCRIPTION: Change number
    ROLES THAT CAN ACCESS: users
    METHOD: patch
    URI: user/mobilenumber/set
    BODY:
        {
            mobileNumber: string,
        }
*/
module.exports.changeNumber = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    return User.findByIdAndUpdate(userData.id, { mobileNumber: req.body.mobileNumber }, { new: true })
        .then(changeNumber => {
            return res.send({ message: 'Updated', numberUpdatedTo: changeNumber.mobileNumber, response: true });
        }
        )
        .catch(err => res.send({ message: 'Failed to Update Email', response: false }));
}

/*CHANGE ADDRESS OR UPDATE
    DESCRIPTION: Change number
    ROLES THAT CAN ACCESS: users
    METHOD: patch
    URI: user/mobilenumber/set
    BODY:
        {
            street: string ,
            city: string,
            state: string,
            zip: number,
            country: string
        }
*/
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

/*TOGGLE USER ADMIN
    DESCRIPTION: Toggle Admin to true or false
    ROLES THAT CAN ACCESS: users and admin
    METHOD: patch
    URI: user/toggleUserRole
*/
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

const Product = require('../models/Product');
const User = require('../models/User');
const stringMethods = require('./stringMethods');
const auth = require("../auth");


module.exports.getAllProducts = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    if (userData.isAdmin) {

        Product.find({})
            .then(products => {
                return res.send({ message: "Successfully retrieved products", products: products, response: true });
            })
            .catch(err => res.send({ message: err.message, response: false }));
    } else {
        return res.send({ message: "You are not authorized to apply this task", response: false });
    }
}

module.exports.getActiveProducts = (req, res) => {
    Product.find({ productStocks: { $gte: 1 } })
        .then(products => {
            return res.send({ message: "Successfully retrieved products", products: products, response: true });
        })
        .catch(err => res.send({ message: err.message, response: false }));
}

module.exports.addProduct = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    if (userData.isAdmin) {
        let product = new Product({
            productName: stringMethods.capitalizeName(req.body.productName),
            productDescription: req.body.productDescription,
            productStocks: req.body.productStocks,
            productPrice: req.body.productPrice
        });

        return product.save()
            .then(productSaved => res.send({ message: "Product has been added", response: true }))
            .catch(err => res.send({ message: "Product was not added. An error has occured", error: err.message, response: false }));

    }
    else {
        return res.send({ message: "You are not authorized to apply this task", response: false });
    }
}

module.exports.forceRemoveProduct = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    if (userData.isAdmin) {
        Product.findByIdAndDelete(req.body._id)
            .then(result => {
                if (result) return res.send({ message: "Product has been deleted", response: true });
                else return res.send({ message: "Product ID does not exist", response: false })
            })
            .catch(err => res.send({ message: err.message, response: false }));
    }
    else {
        return res.send({ message: "You are not authorized to apply this task", response: false });
    }
}

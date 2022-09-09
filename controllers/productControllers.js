const Product = require('../models/Product');
const User = require('../models/User');
const stringMethods = require('./stringMethods');
const auth = require("../auth");

/*GET ALL PRODUCTS
    DESCRIPTION: Gets all products
    ROLES THAT CAN ACCESS: admin
    METHOD: get
    URI: product/listAll
    BODY:
        {
            none
        }
*/
module.exports.getAllProducts = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    if (userData.isAdmin) {

        Product.find({})
            .then(products => {
                return res.send({ message: "Successfully retrieved products", data: products, response: true });
            })
            .catch(err => res.send({ message: err.message, response: false }));
    } else {
        return res.send({ message: "You are not authorized to apply this task", response: false });
    }
}

/*GET ALL ACTIVE PRODUCTS
    DESCRIPTION: Gets all products that are active only
    ROLES THAT CAN ACCESS: admin and user and guests
    METHOD: get
    URI: product/lists
    BODY:
        {
            none
        }
*/
module.exports.getActiveProducts = (req, res) => {
    Product.find({ productStocks: { $gte: 1 } })
        .then(products => {
            return res.send({ message: "Successfully retrieved products", data: products, response: true });
        })
        .catch(err => res.send({ message: err.message, response: false }));
}

/*ADD PRODUCTS
    DESCRIPTION: Add product to database
    ROLES THAT CAN ACCESS: admin
    METHOD: post
    URI: product/add
    BODY:
        {
            productName: string,
            productDescription: string,
            productStocks: number,
            productPrice: number
        }
*/
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

/*REMOVE PRODUCT
    DESCRIPTION: Remove product from database using product id
    ROLES THAT CAN ACCESS: admin
    METHOD: delete
    URI: product/remove
    BODY:
        {
            productId: string,
        }
*/
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

/*GET SPECIFIC PRODUCT
    DESCRIPTION: Get product from database using product id
    ROLES THAT CAN ACCESS: admin and user and guests
    METHOD: get
    URI: product/getproduct
    BODY:
        {
            productId: string,
        }
*/
module.exports.getSpecificProduct = (req, res) => {
    Product.findById(req.body.productId)
        .then(product => {
            return res.send({ message: "Successfully retrieved product", data: product, response: true })
        })
}

/*UPDATE STOCKS AND PRICE PRODUCT
    DESCRIPTION: Updates stocks and price of product
    ROLES THAT CAN ACCESS: admin 
    METHOD: patch
    URI: product/update/price_stocks
    BODY:
        {
            productId: string,
            productStocks: number,
            productPrice: number,
        }
*/
module.exports.updateProductStocksPrice = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    if (userData.isAdmin) {
        Product.findByIdAndUpdate(req.body.productId, { productStocks: req.body.productStocks, productPrice: req.body.productPrice }, { new: true })
            .then(product => {
                return res.send({ message: "Successfully updated product", data: product, response: true })
            })
            .catch(err => {
                return res.send({ message: "Id not found or please check your syntax.", error: err, response: false })
            })
    } else {
        return res.send({ message: "You are not authorized to apply this task", response: false });
    }
}

/*UPDATE PRODUCT NAME AND DESCRIPTION
    DESCRIPTION: Update name and description using product id
    ROLES THAT CAN ACCESS: admin 
    METHOD: patch
    URI: product/update/name_description
    BODY:
        {
            productId: string,
            productName: string,
            productDescription: string,
        }
*/
module.exports.updateProductNameDescription = (req, res) => {
    const userData = auth.decode(req.headers.authorization);
    if (userData.isAdmin) {
        Product.findByIdAndUpdate(req.body.productId, { productName: req.body.productName, productDescription: req.body.productDescription }, { new: true })
            .then(product => {
                return res.send({ message: "Successfully updated product", data: product, response: true })
            })
            .catch(err => {
                return res.send({ message: "Id not found or please check your syntax.", error: err, response: false })
            })
    } else {
        return res.send({ message: "You are not authorized to apply this task", response: false });
    }
}

/*SEARCH PRODUCT
    DESCRIPTION: Search product using levenshtein distance algorithm
    ROLES THAT CAN ACCESS: admin and users and guests
    METHOD: get
    URI: product/search/:query-here
    PARAMS: search/:your-search-word
*/
module.exports.searchProduct = async (req, res) => {
    let products = await Product.find({}).then(result => result).catch(err => err);
    let productsMap = await Product.find({}).then(result => result).catch(err => err);
    products = products.map(e => e.productName.split(" ").join("").toLowerCase());
    
    // REMOVE SPACES 
    req.params.product = req.params.product.replace(/\s/g, '');
    
    // CREATE A MAP FOR PRODUCT IDs
    productsMap = productsMap.map((e, i) => ({ productId: e.id }));

    //https://stackoverflow.com/questions/22876890/find-word-with-mistakes-in-string
    function levenshteinDistance(s, t) {
        if (!s.length) return t.length;
        if (!t.length) return s.length;

        return Math.min(
            levenshteinDistance(s.substr(1), t) + 1,
            levenshteinDistance(t.substr(1), s) + 1,
            levenshteinDistance(s.substr(1), t.substr(1)) + (s.charAt(0).toLowerCase() !== t.charAt(0).toLowerCase() ? 1 : 0)
        );
    }

    var candidateWord = req.params.product;
    var words;
    var results = []; // CONTAINER OF WORDS AND SCORE
    for (var i = 0; i < products.length; i++) {
        words = products[i].split(/[\s.,<>;:'"{}\[\]]+/);
        for (var j = 0; j < words.length; j++) {
            if (words[j]) {
                results.push({ word: words[j], score: levenshteinDistance(words[j], candidateWord) });
            }
        }
    }


    // FILTER ALL PRODUCTS THAT HAS A DISTANCE LESS THAN 6
    productsMap = productsMap.filter((e, i) => results[i].score <= 3);

    let searchResults = [];
    for (let i = 0; i < productsMap.length; i++) {
        searchResults.push(await Product.findById({ _id: productsMap[i].productId }).then(results => results));
    }

    searchResults = searchResults.map(e => ({ productName: e.productName, productDescription: e.productDescription, productStocks: e.productStocks, productPrice: e.productPrice }));

    return res.send({ data: searchResults, response: true });
}
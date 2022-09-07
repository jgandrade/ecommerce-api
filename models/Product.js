const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, "Product Name Required"]
    },
    productDescription: {
        type: String,
        required: [true, "Product Description Required"]
    },
    productStocks: {
        type: Number,
        required: [true, "Product Stock Required"]
    },
    productPrice: {
        type: Number,
        required: [true, "Product Price Required"]
    },
    productCreatedOn: {
        type: Date,
        default: new Date()
    },
    productOrders: [{
        _id: false,
        orderId: {
            type: String,
            required: [true, "Order Id is required"]
        },
        userId: {
            type: String,
            required: [true, "User Id is required"]
        },
        billingName: {
            type: String,
            required: [true, "Billing Name is required"]
        },
        billingAddress: {
            type: String,
            required: [true, "Billing Address is required"]
        },
        totalPrice: {
            type: Number,
            required: [true, "Total Price is required"]
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"]
        },
        orderCreatedOn: {
            type: Date,
            default: new Date()
        }
    }
    ]
})

const Product = new mongoose.model("Product", ProductSchema)

module.exports = Product;
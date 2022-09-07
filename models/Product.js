const mongoose = require('mongoose');

const Product = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, "Product Name Required"]
    },
    productDescription: {
        type: String,
        required: [true, "Product Description Required"]
    },
    productStock: {
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
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            default: mongoose.Types.ObjectId,
            index: { unique: true }
        },
        orderCreatedOn: {
            type: Date,
            default: new Date()
        }
    }
    ]
})
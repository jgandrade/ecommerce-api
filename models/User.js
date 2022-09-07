const mongoose = require('mongoose');

/*

User Id <GENERATED>
First Name <String>
Last Name <String>
Email Address <String>
Mobile Number <String>
Password <String>
Is Admin <Boolean>
Auth Tokens <Array> [

]
Cart <Array>[
{
   Cart Number <Number>
   Product Id <String>
   Product Name <String>
   Product Description <String>
   Product Stock <String>
   Product Price <Number>
   Quantity <Number>
}
]

Orders <Array>[
{
   Order Id <String>
   Product Id <String>
   Quantity <Number>
   PaymentMethod <Object>
   Placed On <Date>
   isDelivered <Boolean>
}
]

Wallet <Array>[
{
   Card Type <String>
   Card Number <String>
   Name on Card <String>
   Expiration Date <String>
}
]


Saved For Later <Array>[
{
   Favorites Id <String>
   Product Id <String>
}
]


*/
const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Last Name is required"]
    },
    emailAddress: {
        type: String,
        required: [true, "Email Address is required"]
    },
    mobileNumber: {
        type: String,
        required: [true, "Mobile Number is required"]
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: new Date()
    },
    authTokens: [],
    userCart: [
        {
            cartNumber: {
                type: Number,
            },
            productId: {
                type: String,
                required: [true, "Product Id is required"]
            },
            quantity: {
                type: Number,
                required: [true, "Quantity of 1 is required"]
            },
            addedOn: {
                type: Date,
                default: new Date()
            }
        }
    ],
    userOrders: [
        {
            orderId: {
                type: String,
                required: [true, "Order Id is required"]
            },
            productId: {
                type: String,
                required: [true, "Product Id is required"]
            },
            quantity: {
                type: Number,
                required: [true, "Quantity is required"]
            },
            orderedOn: {
                type: Date,
                default: new Date()
            }
        }
    ],
    savedForLater: [
        {
            saveId: {
                type: Number,
                required: [true, "Save Id is required"]
            },
            productId: {
                type: String,
                required: [true, "Product ID required."]
            },
            savedOn: {
                type: Date,
                default: new Date()
            }
        }
    ]
});

const User = new mongoose.model("User", UserSchema);

module.exports = User;
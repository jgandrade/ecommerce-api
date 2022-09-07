require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const DB_URL = process.env.DB_URL;
mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Failed connecting to database."));
db.once("open", () => console.log("Successfully connected to database"));

/*

    ROUTES BELOW

*/

// REQUIRE THE ROUTES ******************
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');

// SETUP ROUTES ******************
app.use('/', authRoutes);
app.use('/user', userRoutes);
app.use('/product', productRoutes);

/*

    ROUTES ABOVE

*/

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Port running at ${port}`));
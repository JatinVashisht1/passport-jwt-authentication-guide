const express = require('express')
const path = require('path')
const passport = require('passport')

// gives access to variables set in the .env file via `process.env.VARIABLE_NAME` syntax
require('dotenv').config()

const app = express()
const port = 4000;

// configures the databse and opens a global connection that can be used in any module with `mongoose.connection`
require('./config/database');

// Must first load the models
require('./models/users')

// Pass the global passport object into the configuration function
require('./config/passport')(passport)

// This will initialize the passport object on every request
app.use(passport.initialize());

// Instead of using body-parser middleware, use the new Express implementation of the same thing
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(require('./routes'));

app.listen(port, ()=>{
    console.log(`app listening at http://localhost:${port}`)
})
const mongoose = require('mongoose')

require('dotenv').config()

/**
 * Connect to MongoDb server using the conenction string in the `.env` file.
 * To implement this place the following string in the `.env` file
 * 
 * NODE_ENV=development
 * DB_STRING=mongodb://localhost:27017/tutorial_db_jwt
 * DB_STRING_PROD=not implemented yet
 */

const devConenction = process.env.DB_STRING;
const prodConenction = process.env.DB_STRING_PROD;

// connect to the correct environment database
if(process.env.NODE_ENV === 'production')
{
    mongoose.connect(prodConenction, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    mongoose.connection.on('connected', ()=>{
        console.log('Database connected');
    });
}else{
    mongoose.connect(devConenction, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    mongoose.connection.on('connected', () => {
        console.log('Database connected');
    });
}
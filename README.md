# Passport JWT Authentication [Demo App]
## Description
- This is a demo app created solely for the purpose of practicing passport-jwt authentication
- I will try to provide a good walk-through as we proceed

## Pre-requisites
- [Express.js](https://expressjs.com/en/starter/hello-world.html)
- [MondoDB](https://www.mongodb.com/docs/manual/tutorial/getting-started/)
- [Mongoose](https://mongoosejs.com/docs/index.html)

## Let's do this 💪

### 1. Initialize project
- Create an empty folder and initialize an npm project
    - use `npm init` to create an empty project or `npm init -y` to create the project with default settings
- Install required dependencies
```
npm i --save express mongoose dotenv passport passport-jwt modules jsonwebtoken
```
### 2. Structure Project
- Create following folders
    - config (add passport and database configuration files)
    - lib (to add utility file for issuing jwt, password generation, etc. )
    - models (to define our mongoose models)
    - routes (to define routes of our app)
- Create following files
    - app.js (entry point of our express app)
    - generateKeypair.js (will act as simple script to generate public and private keys for our jwt)

### 3. Populate generateKeypair.js file
- this will act as a script file and will generate public and private keys in .pem format
- click [here](https://knowledge.digicert.com/quovadis/ssl-certificates/ssl-general-topics/what-is-pem-format.html) to know more about pem files
- In terminal run command `node generateKeypair.js` this will generate two files named `id_rsa_priv.pem` and `id_rsa_pub.pem`.

### 4. Modeling Database
- We will make simple schema for our db model
- It will contain three fields only
    - username: username of the user
    - hash: it is the hashed form of the password
        - it takes a plain text of any length and outputs a fixed length string
    - salt: it is a random string. By hashing plain text and salting it makes it no longer predictable
```
const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: String,
    hash: String,
    salt: String
})

// mongoose will take string `User` as model name
// will convert it into lowercase and change it into its plural form and will make a collection with that name
mongoose.model('User', UserSchema)
```

### 5. Populate /lib/utils.js
- According to me, the code that we will put in this fill more or less boilerplate
- We will be using same or similar code snippet in most of our projects
- This file contains three methods
    - validPassword: to validate the password entered by the user
    - genPassword: to generate a new password, will be called when new user will register
    - issueJWT: this will issue new JWT for the user object provided in the parameters
- let us see all three functions breifly 

#### validPassword
```
function validPassword(password, hash, salt){

    // PBKDF2 is a simple cryptographic key derivation function, which is resistant to dictionary attacks and rainbow table attacks
    const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
}
```
- let us see the working of this function
- It will be called when the user will try to login
- this takes three parameters
    - password (in plain text, as entered by user)
    - hash (retreived from database)
    - salt (retreived from database)
- the will generate password from the provided password(from user) and salt (from db) and will check if it is same as it is stored in the database

#### genPassword
```
function genPassword(password){
    const salt = crypto.randomBytes(32).toString('hex');
    const genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    return {
        salt: salt,
        hash: genHash
    };
}
```
- this will be called when a new user is to be registered in the databse
- this takes a password with plain text and will convert it into hashed string
- it will add salt to produce randomness
- a js object is returned with the salt used and hash produced

#### issueJWT
```
function isssueJWT(user){
    const _id = user._id;

    const expiresIn = '1d';

    const payload = {
        sub: _id,
        iat: Date.now()
    };

    const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, {expiresIn: expiresIn, algorithm: 'RS256'})

    return {
        token: "Bearer " + signedToken,
        expiresIn: expiresIn
    }
}
```
- this will be called when the user has been logged in and we have to remember the user
- it will take a user object and will sign it using a library called `jsonwebtoken`. 
- `jsonwebtoken` will take following parameters to sign a jwt
    - payload: it will contains meta data about user for eg. id, iat, etc
    - expiresIn: the life expentency of the jwt
    - algorithm: algorithm with which the signature will be encoded
- the returned object is a js object with fields of token and expiresIn
    - note that the way we are inserting token in the token field above (which is Bearer <signed token>) we have to retreive it in the same way also

### 6. Completing /config/passport.js
- make a new file called `passport.js` in `/config` directory
- in this file we will tell passport what to do when received a payload(user and user data)

#### Options
- firstly we will fill out some options
```
const pathToKey = path.join(__dirname, '..', 'id_rsa_pub.pem');
const PUB_KEY = fs.readFileSync(pathToKey, 'utf-8')

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // we are using public key rather than private
    // because we are configuring verify peice of JWT
    secretOrKey: PUB_KEY,
    algorithms: ['RS256']
};
```
- in options variable we define 3 major things
    - jwtFromRequest: this will tell passport from where it will get jwt, for eg. here we have told it that it will get token from header as bearer
    - secretOrKey: PUB_KEY will be used because we are verifying a user and user will only have our public key
    - algorithm: the algorithm with which jwt is encoded

#### Strategy
```
const strategy = new JWTStrategy(options, (payload, done)=>{
    User.findOne({_id: payload.sub})
    .then((user)=>{
        if(user){
            return (null, user);
        }else{
            return done(null, false);
        }
    })
    .catch(err=>{
        done(err, null)
    })
})
```
- strategy will use JWTStrategy and it takes two options
    - options: that we have defined above
    - callback function: to tell passport what to do when it receives a user
- **Understanding callback**
    - payload is the metadata of the user
        - it will contain the user id or username with which we will query our database
    - done is another callback and will be fired when we finish searching our user
        - the first parameter of done callback is err if any error occured then only this field will contain error else null
        - second parameter will accept either user object or false, if user is found we will return that user or else we will simply return false indicating that user is not found

#### exporting passport strategy
- at last we will export this strategy with a function
```
module.exports = (passport)=>{
    passport.use(strategy)
}
```
### 7. Populating /config/database.js
- now we will set up our database connection and configuration
- so make a new file named `database.js` in config folder
- this file will connect to our database

#### creating `.env` file
- before procedding to database.js file first let us make our `.env` file
- if you don't know, .env file usually contains our variables and code snippets that are confidential and we don't want anyone to see them
- we can access these variables with the `dotenv` package of node, `dotenv` automatically loads environment variables from a . env file into the process. env object
- add following code to .env file
```
NODE_ENV=development
DB_STRING=mongodb://localhost:27017/tutorial_db_jwt
DB_STRING_PROD=not implemented yet
```

#### completing database.js file
- now lets move towards to our `database.js` file
- the database.js file will connect us to our database
```
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
```
- let us understand the above code
- in first two lines we have stored the strings for our database connection in to our devConnection and prodConnection respectively
- devConnection will contain string that will be used in development environment and prodConnection in production environment
- the if else statement is connecting to the production environment database if the `NODE_ENV` file is containing production and development if it is set to development
- here we are using development environment

### 8. Writing /routes/users.js file
- goto routes folder and make a new file users.js
- this will contains all routes relating to {url}/users/{endpoint}
- this file contains three routes
    - '/login' (post route)
    - '/register' (post route)
    - '/protected' (get route)
- let us deconstruct each route one by one
#### /login endpoint
- the code snippet for this route looks like this
```
router.post('/login', function(req, res, next){
    User.findOne({username: req.body.username})
    .then(user => {
        if(!user){
            res.send(401).json({success: false, msg: "could not find user"});
        }
        const isValid = utils.validPassword(req.body.password, user.hash, user.salt)
        if(isValid){
            const tokenObject = utils.isssueJWT(user);
            res.status(200).json({success: true, user: user, token: tokenObject.token, expiresIn: tokenObject.expiresIn})
        }else{
            res.status(401).json({success: false, msg: "incorrect username/password"})
        }        
    })
    // make sure to use an error handler to handle any error
    .catch((err)=>{
        next(err)
    })
})
```
- this route is used to login a pre existing user
- firstly we will check if the user with such username exists or not
    - if it exists then we will proceed further
    - if it does not exist then we will return `401 unauthorized` error
- after verifying username we will see if the username is valid or not, we will validate it by using validatePassword function that we have defined in our /lib/utils.js file
- if the user is valid then it will be issued a jwt else `401 unauthorized` status code along with an error message will be returned

#### /register endpoint
- the `/register` endpoint looks something like this
```
router.post('/register', function(req, res, next){
    // getting plain password
    const saltHash = utils.genPassword(req.body.password);

    const salt = saltHash.salt;
    const hash = saltHash.hash

    const newUser = new User({
        username: req.body.username,
        hash: hash,
        salt: salt
    })

    newUser.save()
    .then((user)=>{
        // issueJWT will grab id from user object
        const jwt = utils.isssueJWT(user)
        res.json({success: true, user: user, tokan: jwt.token, expiresIn: jwt.expiresIn})
    })
    .catch(err => next(err))
});
```
- now let's decode this code snippet
- we will get a saltHash js object from utils.genPassword function defined in /lib/utils.js file and will store it in `saltHash` variable
- then we will create a `user` object to store in database and will store username, salt, hash in the database

#### /protected endpoint
- the `/protected` endpoint looks like this
```
// we are not using session because we are using jwt
// we have to write this or similar to this logic to every route that we want to protect
router.get('/protected', passport.authenticate('jwt', {session: false}), (req, res, next)=>{
    // will land user here if user is valid
    res.status(200).json({success: true, msg: 'you are auhorized'})
});
```
- this code snippet contains logic for any route that we want should be accessed only after user login
- we will add passport.authenticate middleware and passport will do its work
- user will be allowed to access this endpoint only if it is logged in.

### 9. Populating /routes/index.js file
- this file just contains different routes that are being used
- the code snippet for this file is 
```
const router = require('express').Router();
router.use('/users', require('./users'))
module.exports = router
```
- we are simply defining our routes which is `users` only in our case
- and at the end we are just simply exporting the router

### 10. Completing app.js file
- now come to our `app.js` file
- here is the code of our `app.js` file
```
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
```
- no need fear from this large code, let's understand whats happening here
- we are firstly requiring `dotenv` package to load the `.env` variables
- then we are configuring our database and establishing a global connection that can be used in any module with `mongoose.connection` connection
- after that we are requiring `passport` file defined in the `config` folder and passing the passport object to it
- then we are initializing passport, we are using it in app.use sytax because it is a middleware and jwts are stateless and thus we have keep verifying the user
- then we are delegating routes to our /routes directory
- and at last we are listening to our app at the port we defined
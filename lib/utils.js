const crypto = require('crypto')
const jsonwebtoken = require("jsonwebtoken")
const fs = require('fs')
const path = require('path')

const pathToKey = path.join(__dirname, '..', 'id_rsa_priv.pem')
const PRIV_KEY = fs.readFileSync(pathToKey, 'utf-8')


/**
 * 
 * @param {*} password - the plain text password 
 * @param {*} hash - the hash stored in the database
 * @param {*} salt - the salt stored in the database
 * @returns true if hash provided is correct
 * 
 * This function uses crypto library to decrypt the hash using the salt and then
 * compares the decrypted hash/salt with the password that the user provided at login
 */
function validPassword(password, hash, salt){

    // PBKDF2 is a simple cryptographic key derivation function, which is resistant to dictionary attacks and rainbow table attacks
    const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
}


/**
 * 
 * @param {*} password - the password string that the suere inputs to the password field in the register form
 * 
 * This function takes a plain text passsword and creates a salt and hash out of it. 
 * Instead of storing the plaintext password in the databse, the salt and hash are stored for security
 * 
 * ALTERNATIVE: It would also be acceptable to just use a hashing algorithm to make a hash of the plain text password
 * You would then store the hasshed password in the database and then re-hash it to veryfy later (similar to what we do here) 
 * @returns js object with generated salt and hash
 */
function genPassword(password){
    const salt = crypto.randomBytes(32).toString('hex');
    const genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    return {
        salt: salt,
        hash: genHash
    };
}

/**
 * 
 * @param {*} user - The user object. We need this to set the JWT `sub` payload property to the MongoDB user ID
 * @returns js object with token and expires in fields
 */
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

module.exports.validPassword = validPassword;
module.exports.genPassword = genPassword;
module.exports.isssueJWT = isssueJWT;
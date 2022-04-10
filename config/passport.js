const fs = require('fs');
const passport = require('passport');
const { dirname } = require('path');
const path = require('path');
const User = require('mongoose').model('User');
const JWTStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

const pathToKey = path.join(__dirname, '..', 'id_rsa_pub.pem');
const PUB_KEY = fs.readFileSync(pathToKey, 'utf-8')

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // we are using public key rather than private
    // because we are configuring verify peice of JWT
    secretOrKey: PUB_KEY,
    algorithms: ['RS256']
};

const strategy = new JWTStrategy(options, (payload, done)=>{
    User.findOne({_id: payload.sub})
    .then((user)=>{
        if(user){
            return done(null, user);
        }else{
            return done(null, false);
        }
    })
    .catch(err=>{
        done(err, null)
    })
})

module.exports = (passport)=>{
    passport.use(strategy)
}
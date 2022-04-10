const mongoose= require('mongoose');
const router = require('express').Router();
const User = mongoose.model('User');
const passport = require('passport')
const utils = require('../lib/utils')

// we are not using session because we are using jwt
// we have to write this or similar to this logic to every route that we want to protect
router.get('/protected', passport.authenticate('jwt', {session: false}), (req, res, next)=>{
    // will land user here if user is valid
    res.status(200).json({success: true, msg: 'you are auhorized'})
});

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

module.exports = router;
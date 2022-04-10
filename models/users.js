const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: String,
    hash: String,
    salt: String
})

// mongoose will take string `User` as model name
// will convert it into lowercase and change it into its plural form and will make a collection with that name
mongoose.model('User', UserSchema)
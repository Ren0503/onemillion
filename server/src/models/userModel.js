const mongoose = require('mongoose');

const userModel = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        default: function () {
            return `https://secure.gravatar.com/avatar/${this._id}?s=90&d=identicon`;
        }
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false,
    },
    created: {
        type: Date,
        default: Date.now
    }
});

userModel.set('toJSON', { getters: true });
userModel.options.toJSON.transform = (doc, ret) => {
    const obj = { ...ret };
    delete obj._id;
    delete obj.__v;
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('user', userModel);
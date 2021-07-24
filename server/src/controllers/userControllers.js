const User = require('../models/userModel');
const jwtDecode = require('jwt-decode');
const { body, validationResult } = require('express-validator');

const {
    createToken,
    hashPassword,
    verifyPassword
} = require('../utils/authenticate');

exports.signup = async (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        const errors = result.array({ onlyFirstError: true });
        return res.status(422).json({ errors });
    }

    try {
        const { username } = req.body;

        const hashedPassword = await hashPassword(req.body.password);

        const userData = {
            username: username.toLowerCase(),
            password: hashedPassword
        };

        const existingUsername = await User.findOne({
            username: userData.username
        });

        if (existingUsername) {
            return res.status(400).json({
                message: 'Username already exists.'
            });
        }

        const newUser = new User(userData);
        const savedUser = await newUser.save();

        if (savedUser) {
            const token = createToken(savedUser);
            const decodedToken = jwtDecode(token);
            const expiresAt = decodedToken.exp;

            const { username, id, created, isAdmin, avatar } = savedUser;
            const userInfo = {
                username,
                id,
                created,
                isAdmin,
                avatar
            };

            return res.json({
                message: 'User created',
                token,
                userInfo,
                expiresAt
            });
        } else {
            return res.status(400).json({
                message: 'There was a problem creating your account.'
            });
        }
    } catch (error) {
        return res.status(400).json({
            message: 'There was a problem creating your account.'
        });
    }
};

exports.authenticate = async (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        const errors = result.array({ onlyFirstError: true });
        return res.status(422).json({ errors });
    }

    try {
        const { username, password } = req.body;
        const user = await User.findOne({
            username: username.toLowerCase()
        });

        if (!user) {
            return res.status(403).json({
                message: 'Wrong username.'
            });
        }

        const passwordValid = await verifyPassword(password, user.password);

        if (passwordValid) {
            const token = createToken(user);
            const decodedToken = jwtDecode(token);
            const expiresAt = decodedToken.exp;

            const { username, id, created, isAdmin, avatar } = user;
            const userInfo = {
                username,
                id,
                created,
                isAdmin,
                avatar
            };

            return res.json({
                message: 'Login successful',
                token,
                userInfo,
                expiresAt
            });
        } else {
            res.status(403).json({
                message: 'Wrong password.'
            });
        }
    } catch (error) {
        return res.status(400).json({
            message: 'Something went wrong.'
        });
    }
};

exports.listUsers = async (req, res, next) => {
    try {
        const { sortType = '-created' } = req.body;
        const users = await User.find().sort(sortType);
        res.json(users);
    } catch (error) {
        next(error);
    }
};

exports.search = async (req, res, next) => {
    try {
        const users = await User.find({ username: { $regex: req.params.search, $option: 'i' } });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

exports.find = async (req, res, next) => {
    try {
        const users = await User.findOne({ username: req.params.username });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

exports.validateUser = [
    body('username')
        .exists()
        .trim()
        .withMessage('is required')

        .notEmpty()
        .withMessage('cannot be blank')

        .isLength({ max: 16 })
        .withMessage('must be at most 16 characters long')

        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('contains invalid characters'),

    body('password')
        .exists()
        .trim()
        .withMessage('is required')

        .notEmpty()
        .withMessage('cannot be blank')

        .isLength({ max: 16 })
        .withMessage('must be at most 16 characters long')

        .isLength({ max: 50 })
        .withMessage('must be at most 50 characters long')
];
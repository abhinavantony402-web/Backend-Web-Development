const express = require('express');
const { register, login } = require('../services/authService');
const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const user = await register(req.body);
    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await login(req.body);
    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

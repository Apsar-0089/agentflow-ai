const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

const BCRYPT_ROUNDS = 12;

const register = async ({ name, email, password, role = 'operator' }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: ['admin', 'operator'].includes(role) ? role : 'operator',
  });

  const token = generateToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password credentials');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password credentials');
    error.statusCode = 401;
    throw error;
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
    },
    token,
  };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
};

const seedDefaultUsers = async () => {
  try {
    const adminCount = await User.countDocuments({ email: 'admin@agentflow.ai' });
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
      const hashedPassword = await bcrypt.hash('AdminPass123!', salt);
      await User.create({
        name: 'Lead Operations Admin',
        email: 'admin@agentflow.ai',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('[Auth] Default admin account seeded: admin@agentflow.ai');
    }

    const opCount = await User.countDocuments({ email: 'operator@agentflow.ai' });
    if (opCount === 0) {
      const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
      const hashedPassword = await bcrypt.hash('OperatorPass123!', salt);
      await User.create({
        name: 'Primary AI Operator',
        email: 'operator@agentflow.ai',
        password: hashedPassword,
        role: 'operator',
      });
      console.log('[Auth] Default operator account seeded: operator@agentflow.ai');
    }
  } catch (err) {
    console.warn('[Auth] Note on user seeding:', err.message);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  generateToken,
  seedDefaultUsers,
};

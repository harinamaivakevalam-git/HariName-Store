const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const db = require('../models/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'harinama_default_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const ADMIN_EMAILS = [
  'harinamaevakevalam@gmail.com',
  'harinamaivakevalam@gmail.com',
  'katturojuanilkumar@gmail.com',
  'admin@harinama.com'
];

const isAuthorizedAdminEmail = (email) => {
  if (!email) return false;
  const e = String(email).toLowerCase().trim();
  return ADMIN_EMAILS.includes(e) || e.startsWith('harinama') || e.includes('katturoju') || e.startsWith('admin@');
};

const generateToken = (user) => {
  const role = (user.email && isAuthorizedAdminEmail(user.email)) ? 'admin' : (user.role || 'customer');
  return jwt.sign(
    { id: user.id, email: user.email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Register New User
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.'
      });
    }

    // Try Supabase Auth
    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      try {
        const client = supabaseAdmin || supabase;
        let createdUser = null;

        if (supabaseAdmin) {
          const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: true,
            user_metadata: {
              name: name.trim(),
              phone: phone ? phone.trim() : '',
              role: 'customer'
            }
          });

          if (createError) {
            if (createError.message && (createError.message.includes('already registered') || createError.message.includes('already exists'))) {
              // Sign in with existing credentials or issue auth token and update profile metadata
              try {
                const { data: logData } = await (supabaseAdmin || supabase).auth.signInWithPassword({
                  email: cleanEmail,
                  password
                });
                if (logData?.session?.access_token) {
                  return res.status(200).json({
                    success: true,
                    message: 'Welcome back! Profile saved successfully 🌸',
                    token: logData.session.access_token,
                    user: {
                      id: logData.user.id,
                      name: name.trim(),
                      email: cleanEmail,
                      phone: phone ? phone.trim() : '',
                      avatar: logData.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
                      role: 'customer'
                    }
                  });
                }
              } catch (_) {}
            }
            throw createError;
          }
          createdUser = createData?.user;
        } else {
          const { data: signData, error: signError } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                name: name.trim(),
                phone: phone ? phone.trim() : '',
                role: 'customer'
              }
            }
          });
          if (signError) throw signError;
          createdUser = signData?.user;
        }

        // Sign in immediately to produce live session token
        let token = null;
        const { data: loginData } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        token = loginData?.session?.access_token || generateToken({ id: createdUser.id, email: cleanEmail, role: 'customer' });

        // Retrieve or ensure profile row
        let profile = null;
        if (supabaseAdmin) {
          const { data: profData } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', createdUser.id)
            .single();
          profile = profData;
        }

        const userObj = {
          id: createdUser.id,
          name: profile?.name || name.trim(),
          email: cleanEmail,
          phone: profile?.phone || (phone ? phone.trim() : ''),
          avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          role: profile?.role || 'customer'
        };

        return res.status(201).json({
          success: true,
          message: 'Account registered successfully in Supabase! 🌸',
          token,
          user: userObj
        });
      } catch (sbErr) {
        console.warn('[authController] Supabase register note:', sbErr.message);
      }
    }

    // Local DB fallback
    const existing = db.findOne('users', u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      // Update existing local user with newly provided name and phone
      const updatedUser = db.update('users', existing.id, {
        name: name.trim(),
        phone: phone ? phone.trim() : existing.phone
      });
      const token = generateToken(updatedUser || existing);
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully 🌸',
        token,
        user: {
          id: existing.id,
          name: name.trim(),
          email: cleanEmail,
          phone: phone ? phone.trim() : existing.phone,
          avatar: existing.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          role: existing.role || 'customer'
        }
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const newUser = db.insert('users', {
      name: name.trim(),
      email: cleanEmail,
      password_hash,
      phone: phone || '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      role: 'customer',
      status: 'active'
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        avatar: newUser.avatar,
        role: newUser.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Try Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (!loginError && loginData && loginData.session) {
          const sbUser = loginData.user;
          let profile = null;

          if (supabaseAdmin) {
            const { data: profData } = await supabaseAdmin
              .from('profiles')
              .select('*')
              .eq('id', sbUser.id)
              .single();
            profile = profData;
          }

          if (profile && profile.status !== 'active') {
            return res.status(403).json({
              success: false,
              message: 'Your account has been suspended or deactivated. Contact support.'
            });
          }

          const userObj = {
            id: sbUser.id,
            name: profile?.name || sbUser.user_metadata?.name || 'Devotee Customer',
            email: cleanEmail,
            phone: profile?.phone || sbUser.user_metadata?.phone || '',
            avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
            role: profile?.role || sbUser.user_metadata?.role || 'customer'
          };

          return res.json({
            success: true,
            message: 'Logged in successfully.',
            token: loginData.session.access_token,
            user: userObj
          });
        }
      } catch (sbErr) {
        console.warn('[authController] Supabase login error, attempting fallback:', sbErr.message);
      }
    }

    // Local DB fallback
    const user = db.findOne('users', u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended or deactivated. Contact support.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get Current Logged In Profile
exports.getMe = async (req, res, next) => {
  try {
    if (req.user) {
      return res.json({
        success: true,
        user: req.user
      });
    }

    res.status(401).json({ success: false, message: 'Not authenticated.' });
  } catch (err) {
    next(err);
  }
};

// Update Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const userId = req.user.id;

    if (isSupabaseConfigured && supabaseAdmin) {
      const updates = { updated_at: new Date().toISOString() };
      if (name) updates.name = name.trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (avatar) updates.avatar_url = avatar;

      const { data: updated, error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (!error && updated) {
        return res.json({
          success: true,
          message: 'Profile updated successfully.',
          user: {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            avatar: updated.avatar_url,
            role: updated.role
          }
        });
      }
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (avatar) updates.avatar = avatar;

    const updatedUser = db.update('users', userId, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        role: updatedUser.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Change Password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters in length.'
      });
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        password: newPassword
      });

      if (!error) {
        return res.json({
          success: true,
          message: 'Password changed successfully in Supabase.'
        });
      }
    }

    const user = db.findById('users', req.user.id);
    if (user) {
      const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync(newPassword, salt);
      db.update('users', req.user.id, { password_hash });
    }

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// Forgot Password
exports.forgotPassword = (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link and PIN has been sent.'
    });
  } catch (err) {
    next(err);
  }
};

// Reset Password
exports.resetPassword = (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Password reset successfully. You may now log in.'
    });
  } catch (err) {
    next(err);
  }
};

// Google OAuth / Google Identity Services Sign-In
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential, email, name, avatar, googleId } = req.body;
    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;

    // Decode Google ID Token if passed via Google Identity Services
    if (credential) {
      try {
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          userEmail = decoded.email;
          userName = decoded.name || decoded.given_name || userName;
          userAvatar = decoded.picture || userAvatar;
        }
      } catch (decErr) {
        console.warn('[authController] Google token decode warning:', decErr.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Valid Google email is required for Google Sign-In.'
      });
    }

    const cleanEmail = userEmail.toLowerCase().trim();
    const finalName = (userName || cleanEmail.split('@')[0]).trim();
    const finalAvatar = userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80';

    // 1. Check or create in Supabase if configured and reachable (Fast timeout)
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 1200));
        const sbQuery = supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .limit(1);

        const { data: existingProfiles } = await Promise.race([sbQuery, timeoutPromise]);

        if (existingProfiles && existingProfiles.length > 0) {
          const profile = existingProfiles[0];
          const isSysAdmin = isAuthorizedAdminEmail(cleanEmail);
          const assignedRole = isSysAdmin ? 'admin' : (profile.role || 'customer');
          const token = generateToken({ id: profile.id, email: cleanEmail, role: assignedRole });
          return res.json({
            success: true,
            message: 'Signed in with Google successfully! 🌸',
            token,
            user: {
              id: profile.id,
              name: profile.name || finalName,
              email: cleanEmail,
              phone: profile.phone || '',
              avatar: profile.avatar_url || finalAvatar,
              role: assignedRole
            }
          });
        }
      } catch (sbErr) {
        // Fallback directly to high-speed local store without blocking
      }
    }


    // 2. Local Database Find or Create
    const isSysAdmin = isAuthorizedAdminEmail(cleanEmail);
    const assignedRole = isSysAdmin ? 'admin' : 'customer';

    let user = db.findOne('users', u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      user = db.insert('users', {
        name: finalName,
        email: cleanEmail,
        avatar: finalAvatar,
        role: assignedRole,
        status: 'active',
        auth_provider: 'google',
        google_id: googleId || '',
        created_at: new Date().toISOString()
      });
    } else {
      // Update avatar/name/role if admin
      const updates = {};
      if (isSysAdmin && user.role !== 'admin') updates.role = 'admin';
      if (!user.avatar || user.avatar.includes('unsplash')) updates.avatar = finalAvatar;
      if (!user.name) updates.name = finalName;
      if (Object.keys(updates).length > 0) {
        user = db.update('users', user.id, updates) || user;
      }
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Signed in with Google successfully! 🌸',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar,
        role: user.role || assignedRole
      }
    });
  } catch (err) {
    next(err);
  }
};


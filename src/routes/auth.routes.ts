import { Router } from 'express';
import {
  register,
  login,
  registerStaff,
  loginStaff,
  verifyOTP,
  resendOTP,
} from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/staff/register', registerStaff);
router.post('/staff/login', loginStaff);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

export default router;

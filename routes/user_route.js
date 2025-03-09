import express from 'express';

const router = express.Router();
import { getProfile, login, logout, register } from '../controllers/user.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { editProfile } from '../controllers/user.controller.js';

router.route('/register')
  .post(register);



router.route('/login')
.post(login)  


router.route('/logout')
.get(logout)


router.route('/:id/profile')  
  .get(isAuthenticated , getProfile);


router.route('/profile/edit')
  .patch(isAuthenticated , editProfile);

  export default router;
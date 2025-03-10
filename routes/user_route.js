import express from 'express';
import upload from '../middlewares/multer.js';

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
  .patch(isAuthenticated , upload.single('profilePicture') , editProfile);

  export default router;
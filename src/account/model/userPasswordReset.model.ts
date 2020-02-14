import mongoose from 'mongoose';
import UserPasswordResetToken from '../type/userPasswordResetToken';

const userPasswordResetSchema = new mongoose.Schema({
  id: String,
  token: String,
  expire: Number
});

const UserPasswordResetModel = mongoose.model<mongoose.Document & UserPasswordResetToken>(
  'UserPasswordReset',
  userPasswordResetSchema
);

export default UserPasswordResetModel;

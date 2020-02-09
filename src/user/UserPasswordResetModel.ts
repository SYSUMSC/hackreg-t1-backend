import mongoose from 'mongoose';
import UserPasswordResetToken from './UserPasswordResetToken';

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

import mongoose from 'mongoose';
import IUserPasswordResetToken from './IUserPasswordResetToken';

const userPasswordResetSchema = new mongoose.Schema({
    id: String,
    token: String,
    expire: Number,
});

const UserPasswordResetModel = mongoose.model<mongoose.Document & IUserPasswordResetToken>('UserPasswordReset', userPasswordResetSchema);

export default UserPasswordResetModel;

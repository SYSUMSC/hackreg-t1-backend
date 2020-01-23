import mongoose from 'mongoose';
import IUser from './IUser';

const memberInfoSchema = new mongoose.Schema({
    name: String,
    gender: Number,
    captain: Boolean,
    email: String,
    phone: String,
    size: Number,
    school: String,
    education: Number,
    grade: String,
    profession: String,
    experience: String,
});

const signupFormSchema = new mongoose.Schema({
    teamName: String,
    teamDescription: String,
    memberInfo: [memberInfoSchema],
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    confirmed: Boolean,
    form: signupFormSchema,
});

const UserModel = mongoose.model<mongoose.Document & IUser>('User', userSchema);

export default UserModel;

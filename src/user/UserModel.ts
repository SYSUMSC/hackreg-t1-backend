import mongoose from 'mongoose';
import mongooseHidden from 'mongoose-hidden';
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
    email: { type: String, hide: true },
    password: { type: String, hide: true },
    confirmed: Boolean,
    form: signupFormSchema,
});

// mongooseHidden() will only hide items when calling document.toObject() or document.toJson()
memberInfoSchema.plugin(mongooseHidden(), { hidden: { _id: true } });
signupFormSchema.plugin(mongooseHidden(), { hidden: { _id: true } });
userSchema.plugin(mongooseHidden(), { hidden: { _id: true } });

const UserModel = mongoose.model<mongoose.Document & IUser>('User', userSchema);

export default UserModel;

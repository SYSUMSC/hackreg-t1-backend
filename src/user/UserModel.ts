import mongoose from 'mongoose';
import mongooseHidden from 'mongoose-hidden';
import IUser from './IUser';

const memberInfoSchema = new mongoose.Schema({
    name: String,
    gender: String,
    captain: Boolean,
    email: String,
    phone: String,
    size: String,
    school: String,
    education: String,
    grade: String,
    profession: String,
    experience: String,
});

const teamInfoSchema = new mongoose.Schema({
    name: String,
    description: String,
});

const signupFormSchema = new mongoose.Schema({
    teamInfo: teamInfoSchema,
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
teamInfoSchema.plugin(mongooseHidden(), { hidden: { _id: true } });
signupFormSchema.plugin(mongooseHidden(), { hidden: { _id: true } });
userSchema.plugin(mongooseHidden(), { hidden: { _id: true } });

const UserModel = mongoose.model<mongoose.Document & IUser>('User', userSchema);

export default UserModel;

import { IsEmail, IsString, Length, Validate } from 'class-validator';
import CustomPasswordValidator from './CustomPasswordValidator';

class PasswordResetConfirmDto {
    @IsEmail()
    @Length(5, 30)
    public email!: string;

    @IsString()
    @Length(8, 30)
    @Validate(CustomPasswordValidator)
    public password!: string;

    @IsString() // TODO: should have a length limit
    public token!: string;
}

export default PasswordResetConfirmDto;

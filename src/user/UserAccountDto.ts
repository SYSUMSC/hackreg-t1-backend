import { IsEmail, IsString, Length, Validate } from 'class-validator';
import CustomPasswordValidator from './CustomPasswordValidator';

class UserAccountDto {
    @IsEmail()
    @Length(5, 30)
    public email: string;

    @IsString()
    @Length(8, 30)
    @Validate(CustomPasswordValidator)
    public password: string;

    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;
    }
}

export default UserAccountDto;

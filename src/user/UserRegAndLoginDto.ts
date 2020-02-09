import { IsEmail, IsString, Length, Validate } from 'class-validator';
import CustomPasswordValidator from './CustomPasswordValidator';

class UserRegAndLoginDto {
  @IsEmail()
  @Length(5, 30)
  public email!: string;

  @IsString()
  @Length(8, 30)
  @Validate(CustomPasswordValidator)
  public password!: string;
}

export default UserRegAndLoginDto;

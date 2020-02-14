import { IsEmail, Length } from 'class-validator';

class PasswordResetDto {
  @IsEmail()
  @Length(5, 30)
  public email!: string;
}

export default PasswordResetDto;

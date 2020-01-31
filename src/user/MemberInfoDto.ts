import { IsBoolean, IsEmail, IsNumber, IsNumberString, IsString, Length, Matches, Max, Min } from 'class-validator';

// Match all phone numbers from China mainland(exclude lot numbers) and HKSAR
// Reference: https://www.hkepc.com/forum/viewthread.php?fid=26&tid=2190792 & https://github.com/VincentSit/ChinaMobilePhoneNumberRegex
const phoneRegex = /^1[0-9]{10}$|^[569][0-9]{7}$|^(?:\+?86)?1(?:3\d{3}|5[^4\D]\d{2}|8\d{3}|7(?:[01356789]\d{2}|4(?:0\d|1[0-2]|9\d))|9[01356789]\d{2}|6[2567]\d{2}|4[579]\d{2})\d{6}$/;

class MemberInfoDto {
    @IsString()
    @Length(1, 20)
    public name!: string;

    @IsNumberString()
    @Matches(/^[0-2]$/)
    public gender!: string;

    @IsBoolean()
    public captain!: boolean;

    @IsString()
    @Length(1, 50)
    @IsEmail()
    public email!: string;

    @IsString()
    @Matches(phoneRegex)
    public phone!: string;

    @IsNumberString()
    @Matches(/^[0-6]$/)
    public size!: string;

    @IsString()
    @Length(1, 15)
    public school!: string;

    @IsNumberString()
    @Matches(/^[0-2]$/)
    public education!: string;

    @IsString()
    @Length(1, 10)
    public grade!: string;

    @IsString()
    @Length(1, 20)
    public profession!: string;

    @IsString()
    @Length(1, 100)
    public experience!: string;
}

export default MemberInfoDto;

import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsInstance, IsString, Length, Validate, ValidateNested } from 'class-validator';
import 'reflect-metadata';
import CaptainUniquenessValidator from './CaptainUniquenessValidator';
import MemberInfoDto from './MemberInfoDto';

class FormInfoDto {
    @IsString()
    @Length(1, 20)
    public teamName!: string;

    @IsString()
    @Length(1, 50)
    public teamDescription!: string;

    @IsArray()
    @IsInstance(MemberInfoDto, { each: true })
    @Type(() => MemberInfoDto)
    @ValidateNested()
    @Validate(CaptainUniquenessValidator)
    public memberInfo!: MemberInfoDto[];
}

export default FormInfoDto;

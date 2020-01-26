import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsInstance, IsString, Length, Validate, ValidateNested } from 'class-validator';
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
    @ArrayMinSize(2)
    @ArrayMaxSize(6)
    @IsInstance(MemberInfoDto, { each: true })
    @Type(() => MemberInfoDto)
    @ValidateNested()
    @Validate(CaptainUniquenessValidator)
    public memberInfo!: MemberInfoDto[];
}

export default FormInfoDto;

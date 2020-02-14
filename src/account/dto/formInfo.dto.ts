import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInstance,
  Validate,
  ValidateNested
} from 'class-validator';
import 'reflect-metadata';
import CaptainUniquenessValidator from '../validator/captainUniqueness.validator';
import MemberInfoDto from './memberInfo.dto';
import TeamInfoDto from './teamInfo.dto';

class FormInfoDto {
  @IsInstance(TeamInfoDto)
  @Type(() => TeamInfoDto)
  @ValidateNested()
  public teamInfo!: TeamInfoDto;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsInstance(MemberInfoDto, { each: true })
  @Type(() => MemberInfoDto)
  @ValidateNested()
  @Validate(CaptainUniquenessValidator)
  public memberInfo!: MemberInfoDto[];
}

export default FormInfoDto;

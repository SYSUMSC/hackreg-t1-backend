import { Type } from 'class-transformer';
import { IsBoolean, ValidateNested } from 'class-validator';
import 'reflect-metadata';
import FormInfoDto from './FormInfoDto';

class FormUpdateDto {
    @IsBoolean()
    public confirmed!: boolean;

    @ValidateNested()
    @Type(() => FormInfoDto)
    public form!: FormInfoDto;
}

export default FormUpdateDto;

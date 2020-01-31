import { IsString, Length } from 'class-validator';

class TeamInfoDto {
    @IsString()
    @Length(1, 20)
    public name!: string;

    @IsString()
    @Length(1, 50)
    public description!: string;
}

export default TeamInfoDto;

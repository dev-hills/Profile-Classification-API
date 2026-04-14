import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z]+$/, {
    message: 'Name must contain only alphabetic characters',
  })
  name!: string;
}

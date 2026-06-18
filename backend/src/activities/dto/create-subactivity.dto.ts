import { IsString, IsNotEmpty, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubactivityDto {
  @IsString()
  @IsNotEmpty()
  processId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsInt()
  @Type(() => Number)
  year: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  target: number;
}

export class CreateGlobalSubactivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsInt()
  @Type(() => Number)
  year: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  target: number;
}

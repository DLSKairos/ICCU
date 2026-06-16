import { IsDateString, IsInt, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExecutionDto {
  @IsDateString()
  date: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  count?: number;
}

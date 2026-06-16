import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AnnualResetDto {
  @IsInt()
  @Min(2020)
  @Max(2099)
  @Type(() => Number)
  yearToClose: number;
}

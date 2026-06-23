import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateAbsenceDto {
  @IsString()
  @IsNotEmpty()
  processId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  identification: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  employeeName: string;

  @IsDateString()
  requestDate: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  incapacityType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  department: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  diagnosticCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagnosticConcept?: string;
}

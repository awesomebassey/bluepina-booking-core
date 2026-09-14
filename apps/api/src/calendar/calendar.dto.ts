import { Type } from "class-transformer";
import { IsArray, IsDateString, IsNotEmpty, IsString, ValidateNested } from "class-validator";
class BusyRangeDto {
  @IsString() @IsNotEmpty() externalRef!: string;
  @IsDateString() start!: string;
  @IsDateString() end!: string;
}
export class SyncCalendarDto {
  @IsString() @IsNotEmpty() unitId!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => BusyRangeDto) ranges!: BusyRangeDto[];
}

import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";
export class OnboardPropertyDto {
  @IsString() @IsNotEmpty() propertyName!: string;
  @IsString() @IsNotEmpty() slug!: string;
  @IsString() @IsNotEmpty() timezone!: string;
  @IsString() @IsNotEmpty() unitName!: string;
  @IsInt() @Min(1) capacity!: number;
  @IsInt() @Min(1) nightlyRateCents!: number;
  @IsString() @IsNotEmpty() currency!: string;
}

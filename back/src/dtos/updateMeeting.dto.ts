import { IsOptional, IsEnum, IsString } from 'class-validator';

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['scheduled', 'completed', 'canceled'])
  status?: 'scheduled' | 'completed' | 'canceled';
}
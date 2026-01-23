import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateMerchantStatusDto {
  @IsBoolean({ message: 'Is active must be a boolean' })
  @IsNotEmpty({ message: 'Is active is required' })
  isActive!: boolean;
}

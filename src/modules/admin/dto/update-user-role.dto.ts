import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsString({ message: 'Role must be a string' })
  @IsNotEmpty({ message: 'Role is required' })
  @IsIn(['merchant', 'admin', 'super_admin'], {
    message: 'Role must be one of: merchant, admin, super_admin',
  })
  role!: string;
}

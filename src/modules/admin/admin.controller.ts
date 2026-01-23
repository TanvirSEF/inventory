import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateMerchantStatusDto } from './dto/update-merchant-status.dto';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../categories/dto/update-category.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== PROTECTED ADMIN ENDPOINTS ====================

  @Get('stats')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Get('health')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  // ==================== MERCHANTS MANAGEMENT ====================

  @Get('merchants')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  getAllMerchants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllMerchants(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      search,
    );
  }

  @Get('merchants/:id')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  getMerchantById(@Param('id') id: string) {
    return this.adminService.getMerchantById(id);
  }

  @Patch('merchants/:id/status')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  updateMerchantStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateMerchantStatusDto,
  ) {
    return this.adminService.updateMerchantStatus(id, updateStatusDto.isActive);
  }

  @Delete('merchants/:id')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  deleteMerchant(@Param('id') id: string) {
    return this.adminService.deleteMerchant(id);
  }

  // ==================== USERS MANAGEMENT ====================

  @Get('users')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      search,
    );
  }

  @Get('users/:id')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(id, updateRoleDto.role);
  }

  @Delete('users/:id')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ==================== GLOBAL CATEGORIES MANAGEMENT ====================

  @Post('categories')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  createGlobalCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.createGlobalCategory(
      createCategoryDto,
      req.user.id,
    );
  }

  @Get('categories')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  getAllGlobalCategories(@Query('includeInactive') includeInactive?: string) {
    return this.adminService.getAllGlobalCategories(
      includeInactive === 'true',
    );
  }

  @Get('categories/:id')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  getGlobalCategoryById(@Param('id') id: string) {
    return this.adminService.getGlobalCategoryById(id);
  }

  @Patch('categories/:id')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  updateGlobalCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.adminService.updateGlobalCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @UseGuards(SupabaseAuthGuard, SuperAdminGuard)
  deleteGlobalCategory(@Param('id') id: string) {
    return this.adminService.deleteGlobalCategory(id);
  }
}

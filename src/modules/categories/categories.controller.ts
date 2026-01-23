import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Get all active global categories
   * Public endpoint - anyone can view active categories for selection
   */
  @Get()
  getActiveCategories() {
    return this.categoriesService.getActiveGlobalCategories();
  }

  /**
   * Get category by ID
   * Public endpoint - for category details
   */
  @Get(':id')
  getCategoryById(@Param('id') id: string) {
    return this.categoriesService.getGlobalCategoryById(id);
  }
}

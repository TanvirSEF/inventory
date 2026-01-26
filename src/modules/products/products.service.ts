import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';

interface AttributeSchemaItem {
    name: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
}

@Injectable()
export class ProductsService {
    constructor(private readonly supabase: SupabaseService) { }

    async create(merchantId: string, createProductDto: CreateProductDto) {
        // 1. Fetch Merchant's Category ID
        const { data: merchant, error: merchantError } = await this.supabase.client
            .from('merchants')
            .select('category_id')
            .eq('id', merchantId)
            .single();

        if (merchantError || !merchant) {
            throw new BadRequestException('Merchant not found or invalid');
        }

        if (!merchant.category_id) {
            throw new BadRequestException('Merchant does not have a category assigned');
        }

        // 2. Fetch Category Attribute Schema
        const { data: category, error: categoryError } = await this.supabase.client
            .from('global_categories')
            .select('attribute_schema')
            .eq('id', merchant.category_id)
            .single();

        if (categoryError || !category) {
            throw new InternalServerErrorException('Failed to fetch category schema');
        }

        // 3. Validate Attributes against Schema
        this.validateAttributes(createProductDto.attributes, category.attribute_schema);

        // 4. Insert Product
        const { data: product, error: insertError } = await this.supabase.client
            .from('products')
            .insert({
                merchant_id: merchantId,
                category_id: merchant.category_id,
                name: createProductDto.name,
                description: createProductDto.description,
                base_price: createProductDto.base_price,
                stock_level: createProductDto.stock_level,
                attributes: createProductDto.attributes,
                image_urls: createProductDto.image_urls || [],
            })
            .select()
            .single();

        if (insertError) {
            throw new BadRequestException(insertError.message);
        }

        return product;
    }

    private validateAttributes(attributes: Record<string, any>, schema: AttributeSchemaItem[]) {
        // Iterate through schema definitions
        for (const item of schema) {
            const value = attributes[item.name];

            // Check required fields
            if (item.required && (value === undefined || value === null || value === '')) {
                throw new BadRequestException(`Attribute '${item.name}' is required.`);
            }

            // Skip type check if value is optional and missing
            if (value === undefined || value === null) continue;

            // Type checking
            if (item.type === 'number') {
                if (typeof value !== 'number' || isNaN(value)) {
                    throw new BadRequestException(`Attribute '${item.name}' must be a number.`);
                }
            } else if (item.type === 'boolean') {
                if (typeof value !== 'boolean') {
                    throw new BadRequestException(`Attribute '${item.name}' must be a boolean.`);
                }
            } else {
                // Default to string check
                if (typeof value !== 'string') {
                    throw new BadRequestException(`Attribute '${item.name}' must be a string.`);
                }
            }
        }

        // Optional: Fail if extra attributes are present (Strict Mode)
        // const allowedKeys = new Set(schema.map(s => s.name));
        // for (const key of Object.keys(attributes)) {
        //   if (!allowedKeys.has(key)) {
        //     throw new BadRequestException(`Attribute '${key}' is not allowed for this category.`);
        //   }
        // }
    }
}

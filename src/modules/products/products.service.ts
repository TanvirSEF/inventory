import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

interface AttributeSchemaItem {
    name: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
}

@Injectable()
export class ProductsService {
    constructor(private readonly supabase: SupabaseService) { }

    async update(id: string, merchantId: string, updateProductDto: UpdateProductDto) {
        // 1. Verify ownership and get current product details
        const existingProduct = await this.findOne(id, merchantId);

        let updateData: Record<string, any> = {
            ...(updateProductDto.name && { name: updateProductDto.name }),
            ...(updateProductDto.description !== undefined && { description: updateProductDto.description }),
            ...(updateProductDto.base_price !== undefined && { base_price: updateProductDto.base_price }),
            ...(updateProductDto.stock_level !== undefined && { stock_level: updateProductDto.stock_level }),
            ...(updateProductDto.image_urls && { image_urls: updateProductDto.image_urls }),
            updated_at: new Date().toISOString(),
        };

        // 2. Handle dynamic attributes update if provided
        if (updateProductDto.attributes) {
            // Fetch Category Attribute Schema based on product's category_id
            const { data: category, error: categoryError } = await this.supabase.client
                .from('global_categories')
                .select('attribute_schema')
                .eq('id', existingProduct.category_id)
                .single();

            if (categoryError || !category) {
                throw new InternalServerErrorException('Failed to fetch category schema for validation');
            }

            // Merge new attributes with existing ones or use entirely new ones based on requirements.
            // Using a simple merge strategy here.
            const mergedAttributes = { ...existingProduct.attributes, ...updateProductDto.attributes };

            // Validate the merged attributes against the schema
            this.validateAttributes(mergedAttributes, category.attribute_schema);
            updateData.attributes = mergedAttributes;
        }

        // 3. Update the database
        const { data, error } = await this.supabase.client
            .from('products')
            .update(updateData)
            .eq('id', id)
            .eq('merchant_id', merchantId)
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async remove(id: string, merchantId: string) {
        // 1. Verify ownership
        await this.findOne(id, merchantId);

        // 2. Delete the product
        const { error } = await this.supabase.client
            .from('products')
            .delete()
            .eq('id', id)
            .eq('merchant_id', merchantId);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Product deleted successfully' };
    }

    async findOne(id: string, merchantId: string) {
        const { data, error } = await this.supabase.client
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('merchant_id', merchantId)
            .single();

        if (error || !data) {
            throw new NotFoundException('Product not found');
        }

        return data;
    }

    async findAll(merchantId: string, page = 1, limit = 20, search?: string) {
        let query = this.supabase.client
            .from('products')
            .select('*', { count: 'exact' })
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false });

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query.range(from, to);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return {
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        };
    }

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

import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { CategoryService } from '../service/category.service';
import { CreateCategoryDto } from '../../category/dtos/createcategory.dto';
import { UpdateCategoryDto } from '../../category/dtos/updateCategory.dto';

@Controller('/api/v1/category')
export class CategoryController {
    constructor(private categoryService: CategoryService) {}

    @Post()
    createCategory(
        @Headers('authorization') authHeader: string,
        @Body() body: CreateCategoryDto,
    ) {
        return this.categoryService.createCategory(body, authHeader);
    }

    @Get('/all')
    getCategories(@Headers('authorization') authHeader: string) {
        return this.categoryService.getCategories(authHeader);
    }

    @Get()
    getCategory(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.categoryService.getCategory(id, authHeader);
    }

    @Put()
    updateCategory(
        @Headers('authorization') authHeader: string,
        @Query('categoryId') categoryId: string,
        @Body() body: UpdateCategoryDto,
    ) {
        return this.categoryService.updateCategory(
            { categoryId, category: body.category },
            authHeader,
        );
    }

    @Delete()
    deleteCategory(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.categoryService.deleteCategory(id, authHeader);
    }
}

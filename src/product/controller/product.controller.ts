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
import { ProductService } from '../service/product.service';
import { CreateProductDto } from '../dtos/createproduct.dto';
import { UpdateProductDto } from '../dtos/updateproduct.dto';
import { GetProductsDto } from '../dtos/getproducts.dto';

@Controller('/api/v1/product')
export class ProductController {
    constructor(private productService: ProductService) {}

    @Post()
    createProduct(
        @Headers('authorization') authHeader: string,
        @Body() body: CreateProductDto,
    ) {
        return this.productService.createProduct(body, authHeader);
    }

    @Get()
    getProduct(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.productService.getProduct(id, authHeader);
    }

    @Put('/available')
    makeProductAvailable(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.productService.makeProductAvailble(id, authHeader);
    }

    @Put('/unavailable')
    makeProductNotAvailable(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.productService.makeProductUnAvailable(id, authHeader);
    }

    @Put()
    updateProduct(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
        @Body() body: UpdateProductDto,
    ) {
        body.productId = id;
        return this.productService.updateProduct(body, authHeader);
    }

    @Delete()
    deleteProduct(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.productService.deleteProduct(id, authHeader);
    }

    @Get('/seller')
    getSellerProducts(
        @Headers('authorization') authHeader: string,
        @Query() query: GetProductsDto,
    ) {
        return this.productService.getSellerProducts(query, authHeader);
    }

    @Get('/buyer')
    getProductsForCustomer(
        @Headers('authorization') authHeader: string,
        @Query() query: GetProductsDto,
    ) {
        return this.productService.getProductsForCustomer(query, authHeader);
    }

    @Get('/search/seller')
    searchSellerProducts(
        @Headers('authorization') authHeader: string,
        @Query()
        query: GetProductsDto,
    ) {
        return this.productService.searchSellerProducts(query, authHeader);
    }

    @Get('/search/buyer')
    searchProductsForCustomer(
        @Headers('authorization') authHeader: string,
        @Query()
        query: GetProductsDto,
    ) {
        return this.productService.searchProductsForCustomer(query, authHeader);
    }
}

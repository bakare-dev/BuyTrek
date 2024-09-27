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
import { RatingProductDto } from '../dtos/ratingproduct.dto';

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

    @Post('/rate')
    addRatingandComment(
        @Headers('authorization') authHeader: string,
        @Body()
        body: RatingProductDto,
    ) {
        return this.productService.addRatingandComment(body, authHeader);
    }

    @Post('/stock')
    addNewStock(
        @Headers('authorization') authHeader: string,
        @Body()
        body: { productId: string; totalQuantity: number },
    ) {
        return this.productService.addNewStock(body, authHeader);
    }

    @Get('/stock')
    requestStockUpdate(
        @Headers('authorization') authHeader: string,
        @Query('productId')
        productId: string,
    ) {
        return this.productService.requestStockUpdate(productId, authHeader);
    }

    @Get('/inventory/seller')
    getSellerInventory(
        @Headers('authorization') authHeader: string,
        @Query()
        query: { page: number; size: number; sellerId?: string },
    ) {
        return this.productService.getSellerInventory(query, authHeader);
    }

    @Get('/inventory/all')
    getAdminInventory(
        @Headers('authorization') authHeader: string,
        @Query()
        query: { page: number; size: number },
    ) {
        return this.productService.getAdminInventory(query, authHeader);
    }
}

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
import { CartService } from '../service/cart.service';

@Controller('/api/v1/cart')
export class CartController {
    constructor(private cartService: CartService) {}

    @Get()
    getCart(@Headers('authorization') authHeader: string) {
        return this.cartService.getCart(authHeader);
    }

    @Post('/product')
    addProducttoCart(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.cartService.addToCart(id, authHeader);
    }

    @Put('/increase/product')
    increaseProductinCart(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.cartService.increaseProductQuantityInCart(id, authHeader);
    }

    @Put('/decrease/product')
    decreaseProductInCart(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.cartService.decreaseProductQuantityInCart(id, authHeader);
    }

    @Delete('/product')
    removeProductfromCart(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.cartService.removeProductFromCart(id, authHeader);
    }
}

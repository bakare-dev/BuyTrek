import {
    Body,
    Controller,
    Get,
    Headers,
    Ip,
    Post,
    Put,
    Query,
    Req,
} from '@nestjs/common';
import { OrderService } from '../service/order.service';

@Controller('/api/v1/order')
export class OrderController {
    constructor(private orderService: OrderService) {}

    @Post('/')
    initiateAnOrder(@Headers('authorization') authHeader: string) {
        return this.orderService.initiateOrder(authHeader);
    }

    @Post('/paystack/webhook')
    async PaystackWebHook(
        @Headers('x-paystack-signature') signature: string,
        @Body() body: any,
        @Req() req: Request,
        @Ip() ip: string,
    ) {
        const clientIP = req.headers['x-forwarded-for'] || ip;

        return await this.orderService.paystackWebhook(
            signature,
            clientIP,
            body,
        );
    }

    @Put('/cancel')
    cancelOrder(
        @Headers('authorization') authHeader: string,
        @Query() query: { id: string; type: string },
    ) {
        return this.orderService.cancelOrder(query.id, query.type, authHeader);
    }

    @Get('/seller/transaction')
    getSellerTransaction(
        @Headers('authorization') authHeader: string,
        @Query() query: { page: number; size: number; sellerId?: string },
    ) {
        return this.orderService.getSellerTransactions(query, authHeader);
    }

    @Get('/all')
    getOrders(
        @Headers('authorization') authHeader: string,
        @Query() query: { page: number; size: number },
    ) {
        return this.orderService.getOrders(query, authHeader);
    }

    @Get('/new/all')
    getNewOrders(
        @Headers('authorization') authHeader: string,
        @Query() query: { page: number; size: number },
    ) {
        return this.orderService.getNewOrders(query, authHeader);
    }

    @Get('/user/all')
    getUserOrders(
        @Headers('authorization') authHeader: string,
        @Query() query: { page: number; size: number },
    ) {
        return this.orderService.getUserOrders(query, authHeader);
    }

    @Get()
    getOrder(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.orderService.getOrder(id, authHeader);
    }

    @Put('/packaging')
    updateOrdertoPackaging(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.orderService.updateOrdertoPackaging(id, authHeader);
    }

    @Put('/packaged')
    updateOrdertoPackaged(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.orderService.updateOrdertoPackaged(id, authHeader);
    }

    @Put('/out-for-delivery')
    updateOrdertoOutForDelivery(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.orderService.updateOrdertoOutForDelivery(id, authHeader);
    }

    @Put('/delivered')
    updateOrdertoDelivered(
        @Headers('authorization') authHeader: string,
        @Query('id') id: string,
    ) {
        return this.orderService.updateOrdertoDelivered(id, authHeader);
    }
}

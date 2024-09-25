import { Injectable } from '@nestjs/common';

@Injectable()
export class HelperUtil {
    paginate(page?: number, size?: number) {
        const limit = size && size > 0 ? size : 50;
        const currentPage = page && page >= 0 ? page : 0;
        const skip = currentPage * limit;

        return { skip, take: limit };
    }
}

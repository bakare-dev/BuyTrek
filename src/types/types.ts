export class CreateUserPayload {
    emailAddress: string;
    password: string;
    type: number;
}

export class UpdateUserPayload {
    username: string;
    password: string;
}

export class SignInPayload {
    emailAddress: string;
    password: string;
}

export class ActivateAccountPayload {
    userId: string;
    otp: number;
}

export class ResendOtpPayload {
    userId: string;
}

export class InitiatePasswordResetPayload {
    emailAddress: string;
}

export class CompletePasswordResetPayload {
    userId: string;
    password: string;
    otp: number;
}

export class CreateProfilePayload {
    firstName: string;
    lastName: string;
    pictureId: string;
}

export class CreateAddress {
    address: string;
}

export class UpdateAddress {
    address: string;
    addressId: string;
}

export class UpdateDefaultAddress {
    addressId: string;
}

export class DeleteAddress {
    addressId: string;
}

export class GetOrders {
    page: number;
    size: number;
}

export class GetTransaction {
    page: number;
    size: number;
    sellerId?: string;
}

export class GetProducts {
    page: number;
    size: number;
    sellerId?: string;
    categoryId?: string;
    search?: string;
}

export class CreateProduct {
    product: string;
    amount: number;
    description: string;
    pictures: any;
    categoryId: string;
}

export class CreateCategory {
    category: string;
}

export class UpdateCategory {
    category: string;
    categoryId: string;
}

export class RatingProduct {
    productId: string;
    rating: number;
    comment?: string;
}

export class CreateInventory {
    productId: string;
    totalQuantity: number;
}

export class GetInventory {
    page: number;
    size: number;
    sellerId?: string;
}

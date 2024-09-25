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

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

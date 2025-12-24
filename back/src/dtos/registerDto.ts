import { lawyerType } from 'src/entities/lawyer.entity';

export class RegisterDto {
  user: {
    email: string;
    password: string;
  };

  lawyer: {
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
    rut: string;
    type: lawyerType;
  };
}


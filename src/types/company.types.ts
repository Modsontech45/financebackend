export interface CreateCompanyDTO {
  name: string;
  description?: string;
  currencyId: string;
}

export interface UpdateCompanyDTO {
  name?: string;
  description?: string;
  currencyId?: string;
}

export interface AddMemberDTO {
  email: string;
  firstName: string;
  lastName: string;
}

export interface CompanyResponse {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  defaultCurrency: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  };
  memberCount: number;
  transactionCount: number;
  createdAt: Date;
}

export interface MemberResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: Date;
}

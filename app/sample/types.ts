export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

export interface ApplicationForm {
  name: string;
  phone: string;
  companyName: string;
  companyId: string;
  industry: string;
  email: string;
  address: string;
  selectedProducts: string[];
} 
export interface Purchase {
    orderNumber: string;
    products: { name: string }[];  // Products array, where each product has a name
    date: Date;
  }
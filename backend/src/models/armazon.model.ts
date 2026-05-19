export interface Armazon {
  id: number;
  uuid: string;
  nombre: string;
  mecanismo: 'automatico' | 'madera' | 'bolsillo';
  forma?: string;
  dimensionesMax?: string;
  precio: number;
  stock: number;
  activo: boolean;
  createdAt?: string;
}

export interface ArmazonCreate {
  nombre: string;
  mecanismo: string;
  forma?: string;
  dimensionesMax?: string;
  precio: number;
  stock: number;
}

export interface ArmazonUpdate {
  nombre?: string;
  mecanismo?: string;
  forma?: string;
  dimensionesMax?: string;
  precio?: number;
  stock?: number;
  activo?: boolean;
}
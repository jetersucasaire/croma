import { UsuarioRepository } from '../repositories';
import { Usuario } from '../models';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class UsuarioService {
  private repo: UsuarioRepository;
  
  constructor() {
    this.repo = new UsuarioRepository();
  }
  
  getAll(activo = true): Usuario[] {
    return this.repo.findAll(activo);
  }
  
  getById(id: number): Usuario | undefined {
    return this.repo.findById(id);
  }
  
  getByEmail(email: string): Usuario | undefined {
    return this.repo.findByEmail(email);
  }
  
  async create(data: { nombre: string; email: string; password: string; whatsapp?: string; rol?: string }): Promise<number> {
    const existente = this.repo.findByEmail(data.email);
    if (existente) {
      throw new Error('El email ya está registrado');
    }
    
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.repo.create({
      uuid: crypto.randomUUID(),
      nombre: data.nombre,
      email: data.email,
      password: passwordHash,
      rol: data.rol || 'cliente',
      whatsapp: data.whatsapp,
      activo: true
    });
  }
  
  async update(id: number, data: { nombre?: string; whatsapp?: string; rol?: string; activo?: boolean }): Promise<void> {
    const existente = this.repo.findById(id);
    if (!existente) {
      throw new Error('Usuario no encontrado');
    }
    this.repo.update(id, data);
  }
  
  async updatePassword(id: number, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 10);
    this.repo.updatePassword(id, passwordHash);
  }
  
  async validarCredenciales(email: string, password: string): Promise<Usuario | null> {
    const usuario = this.repo.findByEmail(email);
    if (!usuario || !usuario.password) return null;
    
    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) return null;
    
    const { password: _, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword as Usuario;
  }
  
  delete(id: number): void {
    this.repo.softDelete(id);
  }
}
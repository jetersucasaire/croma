import { UsuarioService } from './usuario.service';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { runInsert, runQuery, runUpdate } from '../database';
import { env } from '../config/env';

export class AuthService {
  private usuarioService: UsuarioService;
  
  constructor() {
    this.usuarioService = new UsuarioService();
  }
  
  async login(email: string, password: string): Promise<{ token: string; usuario: any }> {
    const usuario = await this.usuarioService.validarCredenciales(email, password);
    
    if (!usuario) {
      throw new Error('Credenciales incorrectas');
    }
    
    const token = jwt.sign(
      { id: usuario.id, uuid: usuario.uuid, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      env.jwtSecret,
      { expiresIn: '7d' }
    );
    
    const { password: _, ...usuarioResponse } = usuario;
    return { token, usuario: usuarioResponse };
  }
  
  async register(nombre: string, email: string, password: string, whatsapp?: string): Promise<{ token: string; usuario: any }> {
    const passwordValidation = this.validarPassword(password);
    if (!passwordValidation.valid) {
      throw new Error('La contraseña no cumple los requisitos: ' + passwordValidation.errors.join(', '));
    }
    
    const id = await this.usuarioService.create({ nombre, email, password, whatsapp });
    const usuario = this.usuarioService.getById(id);
    
    if (!usuario) {
      throw new Error('Error al crear usuario');
    }
    
    const token = jwt.sign(
      { id: usuario.id, uuid: usuario.uuid, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      env.jwtSecret,
      { expiresIn: '7d' }
    );
    
    const { password: _, ...usuarioResponse } = usuario;
    return { token, usuario: usuarioResponse };
  }
  
  validarPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 12) {
      errors.push('Mínimo 12 caracteres');
    }
    
    let hasUpper = false, hasLower = false, hasNumber = false, hasSpecial = false;
    
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      if (char >= 65 && char <= 90) hasUpper = true;
      if (char >= 97 && char <= 122) hasLower = true;
      if (char >= 48 && char <= 57) hasNumber = true;
      if ((char >= 33 && char <= 47) || (char >= 58 && char <= 64) || (char >= 91 && char <= 96) || (char >= 123 && char <= 126)) {
        hasSpecial = true;
      }
    }
    
    if (!hasUpper) errors.push('Necesita al menos una letra mayúscula');
    if (!hasLower) errors.push('Necesita al menos una letra minúscula');
    if (!hasNumber) errors.push('Necesita al menos un número');
    if (!hasSpecial) errors.push('Necesita al menos un carácter especial');
    
    return { valid: errors.length === 0, errors };
  }
  
  async solicitarRestablecerContrasena(email: string): Promise<void> {
    const usuario = this.usuarioService.getByEmail(email);
    if (!usuario) {
      return;
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);
    
    runInsert(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [usuario.id, token, expiresAt.toISOString()]
    );
    
    console.log('Token de recuperación para ' + email + ': ' + token);
    console.log('Link: http://localhost:5173/restablecer-contrasena?token=' + token);
  }
  
  async restablecerContrasena(token: string, nuevaContrasena: string): Promise<void> {
    const passwordValidation = this.validarPassword(nuevaContrasena);
    if (!passwordValidation.valid) {
      throw new Error('La contraseña no cumple los requisitos: ' + passwordValidation.errors.join(', '));
    }
    
    const tokenData = runQuery(
      `SELECT prt.*, u.id as user_id, u.email 
       FROM password_reset_tokens prt 
       JOIN usuarios u ON prt.user_id = u.id 
       WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > ?`,
      [token, new Date().toISOString()]
    )[0];
    
    if (!tokenData) {
      throw new Error('Token inválido o expirado');
    }
    
    const passwordHash = await bcrypt.hash(nuevaContrasena, 10);
    this.usuarioService.updatePassword(tokenData.user_id, passwordHash);
    runUpdate('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [tokenData.id]);
  }
  
  getUsuarioFromToken(token: string): any {
    try {
      return jwt.verify(token, env.jwtSecret);
    } catch {
      return null;
    }
  }
}
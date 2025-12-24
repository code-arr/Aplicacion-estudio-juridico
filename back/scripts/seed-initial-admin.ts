// scripts/seed-initial-admin.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthRepository } from '../src/auth/auth.repository';
import { AdminRepository } from '../src/repositories/admin.repository';
import { DataSource } from 'typeorm';
import * as readline from 'readline';

// 👇 Helper para hacer preguntas en la terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

function questionSecret(query: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(query);
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');

    let password = '';

    const onData = (char: string) => {
      // 👇 Simplemente usar char directamente, ya está en string
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007f': // Backspace
          password = password.slice(0, -1);
          stdout.clearLine(0);
          stdout.cursorTo(0);
          stdout.write(query + '*'.repeat(password.length));
          break;
        default:
          password += char;
          stdout.write('*');
          break;
      }
    };

    stdin.on('data', onData);
  });
}

async function seedInitialAdmin() {
  console.log('\n🔧 Configuración del Administrador Inicial\n');
  console.log(
    'Este script creará el primer usuario administrador del sistema.',
  );
  console.log('Solo funciona si NO existe ningún administrador previo.\n');

  let app;

  try {
    // 1. Crear contexto de la aplicación
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'], // Solo mostrar errores
    });

    const authRepo = app.get(AuthRepository);
    const adminRepo = app.get(AdminRepository);
    const dataSource = app.get(DataSource);

    // 2. Verificar conexión a la base de datos
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    console.log('✅ Conectado a la base de datos\n');

    // 3. Verificar que NO exista ningún admin
    const existingAdmin = await adminRepo.getAdmin();

    if (existingAdmin) {
      console.error('❌ Error: Ya existe un administrador en el sistema.');
      console.error(
        '   Este script solo funciona para crear el PRIMER administrador.\n',
      );
      console.error(
        '   Para crear administradores adicionales, usá el endpoint:',
      );
      console.error(
        '   POST /admin/create (requiere autenticación de admin)\n',
      );
      process.exit(1);
    }

    console.log('✓ No se encontraron administradores existentes\n');

    // 4. Obtener datos del admin (desde env o prompt)
    let email: string;
    let password: string;

    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      // Modo silencioso (para CI/CD)
      email = process.env.ADMIN_EMAIL;
      password = process.env.ADMIN_PASSWORD;
      console.log('📧 Usando credenciales de variables de entorno');
    } else {
      // Modo interactivo
      email = await question('📧 Email del administrador: ');
      password = await questionSecret('🔐 Contraseña (mínimo 8 caracteres): ');
    }

    // 5. Validaciones básicas
    if (!email || !email.includes('@')) {
      throw new Error('Email inválido');
    }

    if (!password || password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    // 6. Crear el administrador
    console.log('\n⏳ Creando administrador...');

    const result = await authRepo.createAdmin(email, password);

    // 7. Éxito
    console.log('\n✅ ¡Administrador creado exitosamente!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   ID Admin:', result.admin.id);
    console.log('   ID User: ', result.user.id);
    console.log('   Email:   ', result.user.email);
    console.log('   Role:    ', result.user.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANTE: Guardá bien estas credenciales.');
    console.log('   Ya podés iniciar sesión en el sistema.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error al crear el administrador:\n');
    console.error('  ', error.message || error);
    console.error('\n');
    process.exit(1);
  } finally {
    rl.close();
    if (app) {
      await app.close();
    }
  }
}

// Ejecutar
seedInitialAdmin();


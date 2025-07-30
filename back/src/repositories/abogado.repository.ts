import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsObject, isObject } from 'class-validator';
import { log } from 'node:console';
import { AbogadoDto } from 'src/dtos/abogado.dto';
import { Abogado } from 'src/entities/abogado.entity';
import { Cliente } from 'src/entities/cliente.entity';
import { CasoService } from 'src/services/caso.service';
import { ClienteService } from 'src/services/cliente.service';
import { UserService } from 'src/services/user.service';
import { abogadosSeedData } from 'src/utils/abogados';
import { casosSeedData } from 'src/utils/casos';
import { clientesSeedData } from 'src/utils/clientes';
import { Repository } from 'typeorm';

@Injectable()
export class AbogadoRepository {
  constructor(
    @InjectRepository(Abogado) private readonly repository: Repository<Abogado>,
    @InjectRepository(Cliente) private readonly clienteRepository: Repository<Cliente>,
    private readonly userService: UserService,
    private readonly clienteService: ClienteService, // Asegúrate de importar y usar el UserRepository correctamente
    private readonly casoService: CasoService,
  ) {}
  async createAbogado(abogado: AbogadoDto): Promise<Abogado> {
    const newAbogado = this.repository.create(abogado);
    return this.repository.save(newAbogado);
  }
  async getAllAbogados(): Promise<Abogado[]> {
    return this.repository.find({ relations: [ 'clientes'] });
  }
  async saveAbogado(abogado: Abogado): Promise<Abogado> {
    return this.repository.save(abogado);
  }
  async seedData(): Promise<string> {
    try {
      const abogados = abogadosSeedData;
      for (const abogado of abogados) {
        const newAbogado = await this.createAbogado(abogado);
        const usuario = await this.userService.findOneByEmail(
          abogado.userEmail,
        );
        if (usuario) {
          newAbogado.usuario = usuario; // Asocia el usuario al abogado
        }
        await this.repository.save(newAbogado);
      }
      return 'abogados agregados correctamente';
    } catch (error) {
      console.error('Error seeding abogados:', error);
      throw new Error('Error seeding abogados');
    }
  }

  async seedClientesAbogados(): Promise<string> {
    try {
      const abogados = await this.getAllAbogados();
      const clientes = clientesSeedData;

      for (const abogado of abogados) {
        for (const cliente of clientes) {
          if (
            abogado.usuario?.email === cliente.abogadoAsociadoEmail &&
            cliente.email
          ) {
            const clienteReal = await this.clienteService.findByEmail(
              cliente.email,
            );

            if (clienteReal) {
              abogado.clientes.push(clienteReal);
            }
          }
        }
      }

      await this.repository.save(abogados);
      return 'clientes agregados correctamente a los abogados';
    } catch (error) {
      console.error('Error asociando clientes a abogados:', error);
      throw new Error('Error asociando clientes a abogados');
    }
  }

 
  async seedCasosAbogadosyClientes(): Promise<string | undefined> {
    try {
      console.log(`[${new Date().toLocaleTimeString()}] INICIO: Asociación de Casos a Abogados y Clientes.`);

      // ¡IMPORTANTE! Asegúrate de que getAllAbogados y getAllClientes carguen la relación 'casos'
      // para que las verificaciones de duplicados en memoria funcionen.
      const abogados = await this.repository.find({ relations: ['usuario', 'casos'] }); // Cargar casos del abogado
      const clientes = await this.clienteService.getAllClientes(); // Asegúrate de que getAllClientes cargue la relación 'casos' también

      const casosSeed = casosSeedData; // Tus datos de seed
      // const casosReales = await this.casoService.getAllCasos(); // Esta línea no se está usando, puedes quitarla

      for (const abogado of abogados) {
        console.log(`[${new Date().toLocaleTimeString()}] Procesando Abogado: ${abogado.nombre} (${abogado.usuario?.email})`);

        // Inicializa el array de casos del abogado si es undefined
        if (!abogado.casos) {
          abogado.casos = [];
        }

        for (const cliente of clientes) {
          console.log(`[${new Date().toLocaleTimeString()}]   Procesando Cliente: ${cliente.name} (${cliente.email})`);

          // Inicializa el array de casos del cliente si es undefined
          if (!cliente.casos) {
            cliente.casos = [];
          }
          
          for (const casoData of casosSeed) {
            // Verificar si este caso del seed data se aplica a este abogado y cliente
            const isAbogadoMatch = casoData.abogadoEmails.includes(abogado.usuario?.email || '');
            const isClienteMatch = casoData.clienteEmails.includes(cliente.email);

            if (isAbogadoMatch && isClienteMatch) {
              console.log(`[${new Date().toLocaleTimeString()}]     Coincidencia: Caso "${casoData.title}" para este Abogado/Cliente.`);
              
              let casoReal = await this.casoService.findOneByTitle(casoData.title);

              if (casoReal) {
                // --- Prevenir Duplicados para Abogados ---
                // Solo agrega si el caso no está ya en la lista de casos del abogado
                if (!abogado.casos.some(c => c.id === casoReal!.id)) {
                  abogado.casos.push(casoReal);
                  console.log(`[${new Date().toLocaleTimeString()}]     Caso "${casoReal.title}" agregado a Abogado "${abogado.nombre}".`);
                } else {
                  console.log(`[${new Date().toLocaleTimeString()}]     Caso "${casoReal.title}" ya asociado a Abogado "${abogado.nombre}".`);
                }

                // --- Prevenir Duplicados para Clientes ---
                // Solo agrega si el caso no está ya en la lista de casos del cliente
                if (!cliente.casos.some(c => c.id === casoReal!.id)) {
                  cliente.casos.push(casoReal);
                  console.log(`[${new Date().toLocaleTimeString()}]     Caso "${casoReal.title}" agregado a Cliente "${cliente.name}".`);
                } else {
                  console.log(`[${new Date().toLocaleTimeString()}]     Caso "${casoReal.title}" ya asociado a Cliente "${cliente.name}".`);
                }
              } else {
                console.warn(`[${new Date().toLocaleTimeString()}]     Advertencia: Caso "${casoData.title}" del seed data no encontrado en la base de datos.`);
              }
            }
          }
        }
      }

      // Guardar todos los abogados modificados (persiste las relaciones Abogado-Caso)
      console.log(`[${new Date().toLocaleTimeString()}] Guardando cambios para todos los abogados...`);
      await this.repository.save(abogados); // Esto también actualiza la tabla 'abogados_casos'
      
      // Guardar todos los clientes modificados (persiste las relaciones Cliente-Caso)
      console.log(`[${new Date().toLocaleTimeString()}] Guardando cambios para todos los clientes...`);
      await this.clienteRepository.save(clientes); // Esto también actualiza la tabla 'casos_clientes'
      
      console.log(`[${new Date().toLocaleTimeString()}] FINALIZADO: Casos asociados correctamente a abogados y clientes.`);
      return 'casos agregados correctamente a abogados y clientes';

    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] ERROR CRÍTICO en seedCasosAbogadosyClientes:`, error);
      // Re-lanza el error para que sea capturado más arriba si hay un manejador
      throw error;
    }
  }
  
  async  getAbogadoById(id: string): Promise<Abogado | null> {
    return await this.repository.findOne({ where: { id } , relations: [ "clientes.casos" , 'casos.cliente' , 'usuario'] });
  }

  
  async getAbogadoByEmail(email: string): Promise<Abogado | null> {
    return await  this.repository.findOne({ where: { usuario: { email : email } } , relations: ['usuario' , 'clientes' , 'casos'] });
  }
}

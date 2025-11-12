import {
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientItemDto } from '../dtos/clientItem.dto';
import { ClientItem } from '../entities/clientItem.entity';
import { ClienteService } from '../services/cliente.service';
import { ItemTypeService } from '../services/itemType.service';
import { Brackets, DataSource, Repository } from 'typeorm';
import { AbogadoRepository } from './lawyer.repository';
import {
  ArbitrajesEnCursoClientItems,
  ArbitrajesFinalizadosClientItems,
  ArbitrajesLaudosClientItems,
  ConfidencialidadClientItems,
  ConstitucionClientItems,
  ContratosArrendamientoClientItems,
  ContratosComercialesClientItems,
  ContratosLaboralesClientItems,
  ContratosServiciosClientItems,
  DisolucionClientItems,
  JointVenturesClientItems,
  JuiciosAdministrativosClientItems,
  JuiciosCivilesClientItems,
  JuiciosComercialesClientItems,
  JuiciosLaboralesClientItems,
  JuiciosPenalesClientItems,
  JuntasActasClientItems,
  JuntasExtraordinariasClientItems,
  JuntasOrdinariasClientItems,
  ModificacionesClientItems,
  NombramientosClientItems,
  PoderesClientItems,
  PrivadosEnCursoClientItems,
  PrivadosFinalizadosClientItems,
  PrivadosLaudosClientItems,
  PublicosEnCursoClientItems,
  PublicosFinalizadosClientItems,
  PublicosLaudosClientItems,
  RenunciasClientItems,
} from 'src/utils/clientItems';
import { CategoryService } from 'src/services/category.service';
import { SectionService } from 'src/services/section.service';
import { EventService } from 'src/services/event.service';
import { ParentTouchService } from 'src/services/parent-touch.service';
import { UpdateClientItemDto } from 'src/dtos/updateClientItem.dto';

@Injectable()
export class ClientItemRepository implements OnModuleInit {
  constructor(
    @InjectRepository(ClientItem)
    private clientItemRepository: Repository<ClientItem>,
    private readonly itemTypeService: ItemTypeService,
    private readonly clientService: ClienteService,
    private readonly lawyerService: AbogadoRepository,
    private readonly categoryService: CategoryService,
    private readonly sectionService: SectionService,
    private readonly eventService: EventService,
    private readonly parentTouch: ParentTouchService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.seedClientItems();
  }
  async createClientItem(
    clientItem: ClientItemDto,
    lawyerId: string,
  ): Promise<ClientItem> {
    if (clientItem.itemTypeId === undefined) {
      // Manejar el caso en que itemTypeId no está definido
      throw new NotFoundException('itemTypeId es requerido');
    }
    const itemType = await this.itemTypeService.getItemTypeById(
      clientItem.itemTypeId,
    );
    const client = await this.clientService.getClienteById(clientItem.clientId);
    const lawyer = await this.lawyerService.getAbogadoById(lawyerId);
    if (!itemType) {
      throw new NotFoundException('itemType no encontrado');
    }

    if (!client) {
      throw new NotFoundException('cliente no encontrado');
    }

    if (!lawyer) {
      throw new NotFoundException('abogado no encontrado');
    }

    const newClientItem = this.clientItemRepository.create({
      ...clientItem,
      itemType: itemType,
      client: client,
      lawyer: lawyer,
    });

    this.eventService.createEvent({
      action: 'CREATE',
      entityName: newClientItem.title,
      entityId: newClientItem.id,
      entityType: 'CLIENT_ITEM',
      lawyerId: lawyer.id,
    });

    return await this.clientItemRepository.save(newClientItem);
  }

  async createClientItemCategory(
    clientItem: ClientItemDto,
    categoryId: string,
    lawyerId: string,
    clientId: string,
  ): Promise<ClientItem> {
    const category = await this.categoryService.getOneById(categoryId);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const lawyer = await this.lawyerService.getAbogadoById(lawyerId);
    const client = await this.clientService.getClienteById(clientId);
    if (!lawyer) {
      throw new NotFoundException('Abogado no encontrado');
    }
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const newClientItem = this.clientItemRepository.create({
      ...clientItem,
      category: category,
      lawyer: lawyer,
      client: client,
    });

    this.eventService.createEvent({
      action: 'CREATE',
      entityName: newClientItem.title,
      entityId: newClientItem.id,
      entityType: 'CLIENT_ITEM',
      lawyerId: lawyer.id,
    });

    return await this.clientItemRepository.save(newClientItem);
  }

  async createClientItemInSection(
    clientItem: ClientItemDto,
    sectionId: string,
    lawyerId: string,
    clientId: string,
  ): Promise<ClientItem> {
    const section = await this.sectionService.getOneById(sectionId);
    if (!section) {
      throw new NotFoundException('Sección no encontrada');
    }
    const lawyer = await this.lawyerService.getAbogadoById(lawyerId);
    const client = await this.clientService.getClienteById(clientId);
    if (!lawyer) {
      throw new NotFoundException('Abogado no encontrado');
    }
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
    const newClientItem = this.clientItemRepository.create({
      ...clientItem,
      section: section,
      lawyer: lawyer,
      client: client,
    });
    this.eventService.createEvent({
      action: 'CREATE',
      entityName: newClientItem.title,
      entityId: newClientItem.id,
      entityType: 'CLIENT_ITEM',
      lawyerId: lawyer.id,
    });
    return await this.clientItemRepository.save(newClientItem);
  }

  async getByClientId(clientId: string, lawyerId?: string): Promise<any[]> {
    console.log('🟦 [getByClientId] Inicio');
    console.log('➡️ clientId:', clientId);
    console.log(
      '➡️ lawyerId:',
      lawyerId ?? '⚠️ No se envió abogado (solo verá públicos)',
    );

    const queryBuilder = this.clientItemRepository
      .createQueryBuilder('clientItem')
      .leftJoin('clientItem.itemType', 'itemType')
      .leftJoin('clientItem.client', 'client')
      .leftJoin('clientItem.lawyer', 'lawyer') // <-- Propietario
      .leftJoin('clientItem.category', 'category')
      .leftJoin('clientItem.section', 'section')
      .leftJoin('clientItem.documents', 'documents')
      // --- UNIMOS LA NUEVA TABLA DE PERMISOS ---
      .leftJoin('clientItem.sharedWithLawyers', 'sharedLawyer')
      // ----------------------------------------
      .select([
        // ... (todos tus 'select' y 'addSelect' se mantienen igual)
        'clientItem.id AS id',
        'clientItem.title AS title',
        'clientItem.description AS description',
        'clientItem.createdAt AS createdAt',
        'clientItem.updatedAt AS updatedAt',
        'clientItem.activeTime AS activeTime',
        'clientItem.isPrivate AS isPrivate',
        'itemType.id',
        'itemTypeId',
        'client.id',
        'clientId',
        'lawyer.id',
        'lawyerId', // <-- ID del propietario
        'clientItem.status',
        'status',
        'category.id',
        'categoryId',
        'section.id',
        'sectionId',
        'documents.id',
        'documentId',
      ])
      .where('client.id = :clientId', { clientId });

    // --- LÓGICA DE PERMISOS ACTUALIZADA ---
    if (lawyerId) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          // Condición 1: El item es PÚBLICO
          qb.where('clientItem.isPrivate = false');

          // O Condición 2: El item es RESTRINGIDO...
          qb.orWhere(
            new Brackets((privateQb) => {
              privateQb.where('clientItem.isPrivate = true');
              // ...Y (soy el propietario O estoy en la lista de compartidos)
              privateQb.andWhere(
                new Brackets((accessQb) => {
                  accessQb.where('lawyer.id = :lawyerId'); // Soy el propietario
                  accessQb.orWhere('sharedLawyer.id = :lawyerId'); // Estoy en la lista
                }),
              );
            }),
          );
        }),
        { lawyerId }, // Pasamos el ID del abogado que consulta
      );
    } else {
      // Si no hay abogado (ej: un admin system o no logueado), solo ve públicos
      queryBuilder.andWhere('clientItem.isPrivate = false');
    }
    // --------------------------------------------

    const rows = await queryBuilder.getRawMany();

    // Tu lógica de 'reduce' para agrupar documentos funciona perfectamente
    // y manejará los duplicados que genera el leftJoin de sharedLawyer.
    const result = Object.values(
      rows.reduce((acc, row) => {
        if (!acc[row.id]) {
          acc[row.id] = {
            id: row.id,
            title: row.title,
            description: row.description,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            activeTime: row.activeTime,
            isPrivate: row.isPrivate,
            itemTypeId: row.itemTypeId,
            clientId: row.clientId,
            lawyerId: row.lawyerId, // Propietario
            status: row.status,
            categoryId: row.categoryId,
            sectionId: row.sectionId,
            documents: [],
            // Aquí podrías agregar los sharedLawyerIds si los seleccionas en el query
          };
        }

        if (
          row.documentId &&
          !acc[row.id].documents.find((d) => d.id === row.documentId)
        ) {
          acc[row.id].documents.push({ id: row.documentId });
        }

        return acc;
      }, {}),
    );

    return result;
  }

  async getAllClientItems(): Promise<any[]> {
    const rows = await this.clientItemRepository
      .createQueryBuilder('clientItem')
      .leftJoin('clientItem.itemType', 'itemType')
      .leftJoin('clientItem.client', 'client')
      .leftJoin('clientItem.lawyer', 'lawyer')
      .leftJoin('clientItem.category', 'category')
      .leftJoin('clientItem.section', 'section')
      .leftJoin('clientItem.documents', 'documents')
      .select('clientItem.id', 'id')
      .addSelect('clientItem.title', 'title')
      .addSelect('clientItem.description', 'description')
      .addSelect('clientItem.createdAt', 'createdAt')
      .addSelect('clientItem.updatedAt', 'updatedAt')
      .addSelect('clientItem.activeTime', 'activeTime')
      .addSelect('itemType.id', 'itemTypeId')
      .addSelect('client.id', 'clientId')
      .addSelect('lawyer.id', 'lawyerId')
      .addSelect('clientItem.status', 'status')
      .addSelect('category.id', 'categoryId')
      .addSelect('section.id', 'sectionId')
      .addSelect('documents.id', 'documentId')
      .getRawMany();

    // 🔹 Agrupamos para evitar duplicados
    const result = Object.values(
      rows.reduce((acc, row) => {
        if (!acc[row.id]) {
          acc[row.id] = {
            id: row.id,
            title: row.title,
            description: row.description,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            activeTime: row.activeTime,
            itemTypeId: row.itemTypeId,
            clientId: row.clientId,
            lawyerId: row.lawyerId,
            status: row.status,
            categoryId: row.categoryId,
            sectionId: row.sectionId,
            documents: [],
          };
        }

        if (row.documentId) {
          acc[row.id].documents.push({ id: row.documentId });
        }

        return acc;
      }, {}),
    );

    return result;
  }
  async getAllClientItemSeeder(): Promise<ClientItem[]> {
    return this.clientItemRepository.find({
      relations: ['itemType', 'client', 'lawyer'],
    });
  }

  async getClientItemById(id: string): Promise<ClientItem> {
    const clientItem = await this.clientItemRepository.findOne({
      where: { id },
      relations: [
        'itemType.section',
        'documents',
        'processes',
        'meetings',
        'itemType.section.category',
        'category',
        'category.clientItems',
        'section',
        'section.clientItems',
        'section.category',
      ],
    });
    if (!clientItem) {
      throw new NotFoundException('ClientItem not found');
    }
    return clientItem;
  }

  async getByLawyerId(lawyerId: string): Promise<any[]> {
    const rows = await this.clientItemRepository
      .createQueryBuilder('clientItem')
      .leftJoin('clientItem.itemType', 'itemType')
      .leftJoin('clientItem.client', 'client')
      .leftJoin('clientItem.lawyer', 'lawyer') // <-- Abogado Propietario
      .leftJoin('clientItem.category', 'category')
      .leftJoin('clientItem.section', 'section')
      .leftJoin('clientItem.documents', 'documents')
      // --- NUEVO JOIN ---
      // Unimos la tabla de abogados compartidos
      .leftJoin('clientItem.sharedWithLawyers', 'sharedLawyer')
      // ------------------
      .select([
        'clientItem.id AS id',
        'clientItem.title AS title',
        'clientItem.description AS description',
        'clientItem.createdAt AS createdAt',
        'clientItem.updatedAt AS updatedAt',
        'clientItem.activeTime AS activeTime',
      ])
      .addSelect('itemType.id', 'itemTypeId')
      .addSelect('client.id', 'clientId')
      .addSelect('lawyer.id', 'lawyerId')
      .addSelect('clientItem.status', 'status')
      .addSelect('category.id', 'categoryId')
      .addSelect('section.id', 'sectionId')
      .addSelect('documents.id', 'documentId')
      // --- LÓGICA ACTUALIZADA ---
      // El abogado verá el item si:
      // 1. Es el propietario (lawyer.id = :lawyerId)
      // O
      // 2. Está en la lista de compartidos (sharedLawyer.id = :lawyerId)
      .where(
        new Brackets((qb) => {
          qb.where('lawyer.id = :lawyerId').orWhere(
            'sharedLawyer.id = :lawyerId',
          );
        }),
        { lawyerId },
      )
      // ---------------------------
      .getRawMany();

    // 🔹 Agrupamos para evitar duplicados (Tu lógica de reduce ya maneja esto)
    const result = Object.values(
      rows.reduce((acc, row) => {
        if (!acc[row.id]) {
          acc[row.id] = {
            id: row.id,
            title: row.title,
            description: row.description,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            activeTime: row.activeTime,
            itemTypeId: row.itemTypeId,
            clientId: row.clientId,
            lawyerId: row.lawyerId,
            status: row.status,
            categoryId: row.categoryId,
            sectionId: row.sectionId,
            documents: [],
          };
        }

        if (
          row.documentId &&
          !acc[row.id].documents.find((d) => d.id === row.documentId)
        ) {
          acc[row.id].documents.push({ id: row.documentId });
        }

        return acc;
      }, {}),
    );

    return result;
  }

  async seedClientItems() {
    const lawyerExists = await this.lawyerService.getAllLawyers();
    const clientsExists = await this.clientService.getAllClientes();
    if (lawyerExists.length > 1 && clientsExists.length > 1) {
      const itemTypes = await this.itemTypeService.getAllItemTypesSeeder();
      const itemClientsExists = await this.clientItemRepository.find();
      const client = await this.clientService.findByEmail(
        'maria.gonzalez@example.com',
      );
      const lawyer = await this.lawyerService.getAbogadoByEmail(
        'benjadelcampo15@gmail.com',
      );
      if (!lawyer) {
        throw new NotFoundException('Abogado no encontrado');
      }
      if (!client) {
        throw new NotFoundException('Cliente no encontrado');
      }
      if (itemClientsExists.length > 0) {
        return;
      }

      // Se crea un mapa para un acceso más rápido a los itemTypes por nombre
      const itemTypesMap = new Map();
      for (const item of itemTypes) {
        itemTypesMap.set(item.name, item);
      }

      for (const item of itemTypes) {
        if (item.section.name === 'Sociedad') {
          if (item.name === 'Constitucion') {
            await this.clientItemRepository.save(
              ConstitucionClientItems.map((clientItem) => ({
                ...clientItem,
                itemType: item,
                client: client,
                lawyer: lawyer,
              })),
            );
          } else if (item.name === 'Modificaciones') {
            await this.clientItemRepository.save(
              ModificacionesClientItems.map((clientItem) => ({
                ...clientItem,
                itemType: item,
                client: client,
                lawyer: lawyer,
              })),
            );
          } else if (item.name === 'Disolucion') {
            await this.clientItemRepository.save(
              DisolucionClientItems.map((clientItem) => ({
                ...clientItem,
                itemType: item,
                client: client,
                lawyer: lawyer,
              })),
            );
          }
        } else if (item.section.name === 'Directorios') {
          if (item.name === 'Nombramientos') {
            await this.clientItemRepository.save(
              NombramientosClientItems.map((clientItem) => ({
                ...clientItem,
                itemType: item,
                client: client,
                lawyer: lawyer,
              })),
            );
          } else if (item.name === 'Renuncias') {
            await this.clientItemRepository.save(
              RenunciasClientItems.map((clientItem) => ({
                ...clientItem,
                itemType: item,
                client: client,
                lawyer: lawyer,
              })),
            );
          } else if (item.name === 'Poderes') {
            await this.clientItemRepository.save(
              PoderesClientItems.map((clientItem) => ({
                ...clientItem,
                itemType: item,
                client: client,
                lawyer: lawyer,
              })),
            );
          }
        } else if (item.section.name === 'Juntas accionistas') {
          if (item.name === 'Ordinarias') {
            await this.clientItemRepository.save(
              JuntasOrdinariasClientItems.map((clientItem) => ({
                ...clientItem,
                itemType: item,
                client: client,
                lawyer: lawyer,
              })),
            );
          } else if (item.name === 'Extraordinarias') {
            await this.clientItemRepository.save(
              JuntasExtraordinariasClientItems.map((clientItem) => ({
                ...clientItem,
                itemType: item,
                client: client,
                lawyer: lawyer,
              })),
            );
          } else if (item.name === 'Actas') {
            await this.clientItemRepository.save(
              JuntasActasClientItems.map((clientItem) => ({
                ...clientItem,
                itemType: item,
                client: client,
                lawyer: lawyer,
              })),
            );
          }
        } else if (item.section.name === 'Contratos') {
          if (item.name === 'Laborales') {
            await this.clientItemRepository.save(
              ContratosLaboralesClientItems.map((clientItem) => ({
                ...clientItem,
                itemType: item,
                client: client,
                lawyer: lawyer,
              })),
            );
          }
        }
      }
    }
  }

  async updateClientItemAccess(
    clientItemId: string,
    accessData: { isPrivate: boolean; sharedLawyerIds: string[] },
  ): Promise<ClientItem> {
    const clientItem = await this.clientItemRepository.findOne({
      where: { id: clientItemId },
    });
    if (!clientItem) {
      throw new NotFoundException('ClientItem no encontrado');
    }

    // Asumimos que existe este método en tu lawyerService (AbogadoRepository)
    // Debería usar: return this.abogadoRepository.find({ where: { id: In(ids) } });
    const lawyers = await this.lawyerService.getLawyersByIds(
      accessData.sharedLawyerIds,
    );

    clientItem.isPrivate = accessData.isPrivate;
    clientItem.sharedWithLawyers = lawyers;

    return await this.clientItemRepository.save(clientItem);
  }

  async updateClientItemSimple(
    clientItemId: string,
    updateData: UpdateClientItemDto,
  ): Promise<ClientItem> {
    return this.dataSource.transaction(async (manager) => {
      const clientItem = await manager.getRepository(ClientItem).findOne({
        where: { id: clientItemId },
        relations: ['client'],
      });
      if (!clientItem) throw new NotFoundException('ClientItem no encontrado');

      // Actualizar solo los campos recibidos
      Object.assign(clientItem, updateData);

      const updated = await manager.getRepository(ClientItem).save(clientItem);

      // TOCAR padre usando el manager
      if (clientItem.client?.id) {
        await this.parentTouch.touchClient(manager, clientItem.client.id);
      }

      return updated;
    });
  }
}

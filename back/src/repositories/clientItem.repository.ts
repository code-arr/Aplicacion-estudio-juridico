// src/repositories/clientItem.repository.ts
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
  ConstitucionClientItems,
  ContratosLaboralesClientItems,
  DisolucionClientItems,
  JuntasActasClientItems,
  JuntasExtraordinariasClientItems,
  JuntasOrdinariasClientItems,
  ModificacionesClientItems,
  NombramientosClientItems,
  PoderesClientItems,
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

  async createClientItemGeneric(
    clientItem: ClientItemDto,
    lawyerId: string,
    clientId: string,
  ): Promise<ClientItem> {
    const lawyer = await this.lawyerService.getAbogadoById(lawyerId);
    const client = await this.clientService.getClienteById(clientId);

    if (!lawyer) throw new NotFoundException('Abogado no encontrado');
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const newClientItem = this.clientItemRepository.create({
      ...clientItem,
      lawyer,
      client,
      // explicitamente no incluyo itemType/section/category
      itemType: null,
      section: null,
      category: null,
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

    // traemos entidades completas (TypeORM mapea todo y evita problemas de alias)
    const items = await this.clientItemRepository
      .createQueryBuilder('clientItem')
      .leftJoinAndSelect('clientItem.itemType', 'itemType')
      .leftJoinAndSelect('clientItem.client', 'client')
      .leftJoinAndSelect('clientItem.lawyer', 'lawyer')
      .leftJoinAndSelect('clientItem.category', 'category')
      .leftJoinAndSelect('clientItem.section', 'section')
      .leftJoinAndSelect('clientItem.documents', 'documents')
      // Traemos la relación profunda
      .leftJoinAndSelect('clientItem.sharedWithLawyers', 'sharedLawyer')
      .leftJoinAndSelect('sharedLawyer.user', 'sharedUser')
      .where('client.id = :clientId', { clientId })
      .getMany();

    const visible = items.filter((ci) => {
      if (!ci.isPrivate) return true;
      if (!lawyerId) return false;
      if (ci.lawyer?.id === lawyerId) return true;
      return !!ci.sharedWithLawyers?.some((s) => s.id === lawyerId);
    });

    const result = visible.map((ci) => ({
      id: ci.id,
      title: ci.title,
      description: ci.description,
      createdAt: ci.createdAt,
      updatedAt: ci.updatedAt,
      activeTime: ci.activeTime,
      isPrivate: ci.isPrivate,
      itemTypeId: ci.itemType?.id ?? null,
      clientId: ci.client?.id ?? null,
      // 👇 AGREGÁ ESTO PARA QUE EL FRONT NO MUESTRE GUIONES
      client: ci.client
        ? {
            id: ci.client.id,
            firstName: ci.client.firstName,
            lastName: ci.client.lastName,
            companyName: ci.client.companyName,
            type: ci.client.type,
          }
        : null,
      lawyerId: ci.lawyer?.id ?? null,
      status: ci.status,
      categoryId: ci.category?.id ?? null,
      sectionId: ci.section?.id ?? null,
      documents: (ci.documents ?? []).map((d) => ({ id: d.id })),

      // 🔥 MISMO BLINDAJE AQUI:
      sharedWithLawyers: (ci.sharedWithLawyers ?? [])
        .filter((l) => l && l.id)
        .map((l: any) => ({
          id: l.id,
          firstName: l.firstName,
          lastName: l.lastName,
          email: l.user?.email || l.email || '',
        })),
    }));

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
        'lawyer', // 👈 El dueño
        'lawyer.user', // 👈 Para sacar el email del dueño
        'sharedWithLawyers', // 👈 Los colaboradores
        'sharedWithLawyers.user', // 👈 Para sacar el email de los colaboradores
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
    const items = await this.clientItemRepository
      .createQueryBuilder('clientItem')
      .leftJoinAndSelect('clientItem.itemType', 'itemType')
      .leftJoinAndSelect('clientItem.client', 'client')
      .leftJoinAndSelect('clientItem.lawyer', 'lawyer')
      .leftJoinAndSelect('clientItem.category', 'category')
      .leftJoinAndSelect('clientItem.section', 'section')
      .leftJoinAndSelect('clientItem.documents', 'documents')
      // 1. Traemos los abogados compartidos Y sus usuarios para sacar el email
      .leftJoinAndSelect('clientItem.sharedWithLawyers', 'sharedLawyers')
      .leftJoinAndSelect('sharedLawyers.user', 'sharedUser')
      .where(
        new Brackets((qb) => {
          qb.where('clientItem.isPrivate = :isPublic', { isPublic: false })
            .orWhere('lawyer.id = :lawyerId', { lawyerId })
            .orWhere('sharedLawyers.id = :lawyerId', { lawyerId });
        }),
      )
      .getMany();

    const result = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      activeTime: item.activeTime,
      isPrivate: item.isPrivate,
      itemTypeId: item.itemType?.id ?? null,
      clientId: item.client?.id ?? null,
      // 👇 AGREGÁ ESTO PARA QUE EL FRONT NO MUESTRE GUIONES
      client: item.client
        ? {
            id: item.client.id,
            firstName: item.client.firstName,
            lastName: item.client.lastName,
            companyName: item.client.companyName,
            type: item.client.type,
          }
        : null,
      lawyerId: item.lawyer?.id ?? null,
      status: item.status,
      categoryId: item.category?.id ?? null,
      sectionId: item.section?.id ?? null,
      documents: (item.documents || []).map((d: any) => ({ id: d.id })),

      // 🔥 BLINDAJE ANTIBOMBAS AQUI:
      sharedWithLawyers: (item.sharedWithLawyers || [])
        .filter((l) => l && l.id) // Filtramos nulos o undefined
        .map((l: any) => ({
          // Usamos 'any' temporalmente para evitar líos de tipos si Lawyer entity no tiene email declarado
          id: l.id,
          firstName: l.firstName,
          lastName: l.lastName,
          // Intentamos sacar el email del usuario, si no existe, string vacío.
          email: l.user?.email || l.email || '',
        })),
    }));

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
  async deleteClientItem(id: string): Promise<void> {
    await this.clientItemRepository.delete(id);
    // TypeORM intentará borrar el registro con ese ID.
    // No se lanza un error si el ID no existe, simplemente 'affected' será 0.
  }
}

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
import { Repository } from 'typeorm';
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
  ) {}

  async onModuleInit() {
    await this.seedClientItems();
  }
  async createClientItem(
    clientItem: ClientItemDto,
    itemTypeId: string,
    clientId: string,
    lawyerId: string,
  ): Promise<ClientItem> {
    const itemType = await this.itemTypeService.getItemTypeById(itemTypeId);
    const client = await this.clientService.getClienteById(clientId);
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

    return await this.clientItemRepository.save(newClientItem);
  }

  async createClientItemCategory(
    clientItem: ClientItemDto,
    categoryId: string,
  ): Promise<ClientItem> {
    const category = await this.categoryService.getOneById(categoryId);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const newClientItem = this.clientItemRepository.create({
      ...clientItem,
      category: category,
    });
    return await this.clientItemRepository.save(newClientItem);
  }

  async createClientItemInSection(
    clientItem: ClientItemDto,
    sectionId: string
  ): Promise<ClientItem> {
    const section = await this.sectionService.getOneById(sectionId);
    if (!section) {
      throw new NotFoundException('Sección no encontrada');
    }

    const newClientItem = this.clientItemRepository.create({
      ...clientItem,
      section: section,
    });
    return await this.clientItemRepository.save(newClientItem);
  }

  async getAllClientItems(): Promise<any[]> {
    return this.clientItemRepository
      .createQueryBuilder('clientItem')
      .leftJoin('clientItem.itemType', 'itemType') // Unión para obtener el ID de ItemType
      .leftJoin('clientItem.client', 'client') // <-- Unión para obtener el ID de Client
      .leftJoin('clientItem.lawyer', 'lawyer') // <-- Unión para obtener el ID de Lawyer
      .leftJoin('clientItem.category', 'category') // <-- Unión para obtener el ID de Category
      .leftJoin("clientItem.section", "section") // <-- Unión para obtener el ID de Section
      .leftJoin("clientItem.documents", "documents")
      .select([
        'clientItem.id AS id',
        'clientItem.title AS title',
        'clientItem.description AS description',
      ])
      .addSelect('itemType.id', 'itemTypeId')
      .addSelect('client.id', 'clientId') // <-- Selección del ID del cliente
      .addSelect('lawyer.id', 'lawyerId') // <-- Selección del ID del abogado
      .addSelect('clientItem.status', 'status') // <-- Selección del estado del cliente
      .addSelect("clientItem.category.id", "categoryId")
      .addSelect("clientItem.section.id", "sectionId") // <-- Selección del ID de la sección
      .addSelect("documents.id", "documentId") // <-- Selección del ID del documento
      .getRawMany();
  }

  async getAllClientItemSeeder(): Promise<ClientItem[]> {
    return this.clientItemRepository.find({
      relations: ['itemType', 'client', 'lawyer'],
    });
  }

  async getClientItemById(id: string): Promise<ClientItem> {
    const clientItem = await this.clientItemRepository.findOne({
      where: { id },
      relations: ['itemType.section', 'documents' , 'itemType.section.category', "category" , "category.clientItems" , "section" , "section.clientItems" , "section.category"],
    });
    if (!clientItem) {
      throw new NotFoundException('ClientItem not found');
    }
    return clientItem;
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
        'abogado1@example.com',
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
}

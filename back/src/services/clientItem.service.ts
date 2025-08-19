import { Injectable } from "@nestjs/common";
import { ClientItemDto } from "../dtos/clientItem.dto";
import { ClientItem } from "../entities/clientItem.entity";
import { ClientItemRepository } from "../repositories/clientItem.repository";

@Injectable()
export class ClientItemService {
 constructor(
    private readonly clientItemRepository : ClientItemRepository,
 ){}

 async createClientItem(
     clientItem: ClientItemDto,
     itemTypeId: string,
     clientId : string,
     lawyerId : string
   ): Promise<ClientItem> {

    return this.clientItemRepository.createClientItem(clientItem , itemTypeId ,clientId , lawyerId) 

 }

 async getAllClientItems(): Promise<any[]> {
    return this.clientItemRepository.getAllClientItems();
 }

 async getClientItemById(id: string): Promise<ClientItem> {
   return this.clientItemRepository.getClientItemById(id);
 }
}
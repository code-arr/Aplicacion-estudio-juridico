// src/services/parent-touch.service.ts
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ClientItem } from '../entities/clientItem.entity';
import { Client } from '../entities/client.entity';

@Injectable()
export class ParentTouchService {
  async touchClientItem(manager: EntityManager, clientItemId: string) {
    await manager
      .getRepository(ClientItem)
      .update({ id: clientItemId }, { updatedAt: () => 'now()' });
  }

  async touchClient(manager: EntityManager, clientId: string) {
    await manager
      .getRepository(Client)
      .update({ id: clientId }, { updatedAt: () => 'now()' });
  }
}

import { ClientItem } from 'src/entities/clientItem.entity';

export class ProcessDto {
  name: string;
  description: string;
  durationSec: number;
  dateTime: string;
  clientItem: ClientItem;
  clientId: string;
}

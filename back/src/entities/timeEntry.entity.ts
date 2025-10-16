import { IsEnum, IsUUID } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';

export enum trackableType {
  CLIENT = 'Client',
  CLIENT_ITEM = 'ClientItem',
  LAWYERAPP = 'LawyerApp',
  DOCUMENT = 'Document',
  AUDIENCE = 'Audience',
  MEETING = 'Meeting',
  PROCESS = 'Process',
}

@Entity()
export class TimeEntry {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'uuid' })
  @IsUUID()
  lawyerId: string = uuid();

  @Column({ type: 'enum', enum: trackableType })
  @IsEnum(trackableType)
  trackableType: trackableType;

  @Column({ type: 'uuid' })
  @IsUUID()
  trackableId: string = uuid();

  @Column({ type: 'varchar' })
  startedAt: string;

  @Column({ type: 'varchar' })
  endedAt: string;

  @Column({ type: 'int', nullable: true })
  durationSec: number;

  @Column({ type: 'enum', enum: ['AUTO', 'MANUAL'] })
  entryType: 'AUTO' | 'MANUAL';

  @Column({ type: 'uuid', nullable: true })
  deliveredFromEntryId: string;

}

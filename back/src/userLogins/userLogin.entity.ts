import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Index(['userId', 'createdAt'])
@Index(['userId', 'deviceId', 'createdAt'])
@Entity('user_logins')
export class UserLogin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ length: 128 })
  deviceId: string;

  @Column({ length: 255 })
  userAgent: string;

  @Column({ length: 64 })
  ip: string;

  @CreateDateColumn()
  createdAt: Date;
}

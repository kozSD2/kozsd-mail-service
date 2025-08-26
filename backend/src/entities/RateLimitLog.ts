import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn
} from 'typeorm';

@Entity('rate_limit_logs')
export class RateLimitLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  identifier: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'int', default: 1 })
  count: number;

  @Column({ name: 'window_start' })
  windowStart: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
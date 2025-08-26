import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './User';

@Entity('login_attempts')
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string | null;

  @Column({ type: 'boolean' })
  success: boolean;

  @Column({ name: 'failure_reason', nullable: true })
  failureReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.loginAttempts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn
} from 'typeorm';

@Entity('encryption_keys')
export class EncryptionKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'key_version', type: 'int' })
  keyVersion: number;

  @Column({ name: 'encrypted_key' })
  encryptedKey: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
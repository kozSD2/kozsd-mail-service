import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Email } from './Email';
import { User } from './User';
import { ScanResult } from './enums';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'encrypted_name' })
  encryptedName: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @Column({ name: 's3_key' })
  s3Key: string;

  @Column({ name: 'email_id', type: 'uuid', nullable: true })
  emailId: string | null;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string;

  @Column({ name: 'is_scanned', default: false })
  isScanned: boolean;

  @Column({ 
    name: 'scan_result',
    type: 'enum', 
    enum: ScanResult,
    nullable: true 
  })
  scanResult: ScanResult | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Email, email => email.attachments, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'email_id' })
  email: Email;

  @ManyToOne(() => User, user => user.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by' })
  user: User;
}
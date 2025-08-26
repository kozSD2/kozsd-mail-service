import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne,
  JoinColumn,
  Unique
} from 'typeorm';
import { Email } from './Email';
import { Folder } from './Folder';

@Entity('email_folders')
@Unique(['emailId', 'folderId'])
export class EmailFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email_id', type: 'uuid' })
  emailId: string;

  @Column({ name: 'folder_id', type: 'uuid' })
  folderId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Email, email => email.folders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'email_id' })
  email: Email;

  @ManyToOne(() => Folder, folder => folder.emails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;
}
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { User } from './User';
import { EmailRecipient } from './EmailRecipient';
import { Attachment } from './Attachment';
import { EmailFolder } from './EmailFolder';
import { Priority } from './enums';

@Entity('emails')
export class Email {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'encrypted_subject' })
  encryptedSubject: string;

  @Column({ name: 'encrypted_body' })
  encryptedBody: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'is_starred', default: false })
  isStarred: boolean;

  @Column({ name: 'is_draft', default: false })
  isDraft: boolean;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ 
    type: 'enum', 
    enum: Priority, 
    default: Priority.NORMAL 
  })
  priority: Priority;

  @Column({ name: 'sent_at', default: () => 'CURRENT_TIMESTAMP' })
  sentAt: Date;

  @Column({ name: 'read_at', nullable: true })
  readAt: Date | null;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.sentEmails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @OneToMany(() => EmailRecipient, recipient => recipient.email)
  recipients: EmailRecipient[];

  @OneToMany(() => Attachment, attachment => attachment.email)
  attachments: Attachment[];

  @OneToMany(() => EmailFolder, folder => folder.email)
  folders: EmailFolder[];
}
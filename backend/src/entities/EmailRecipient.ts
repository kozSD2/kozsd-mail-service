import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne,
  JoinColumn,
  Unique
} from 'typeorm';
import { Email } from './Email';
import { User } from './User';
import { RecipientType } from './enums';

@Entity('email_recipients')
@Unique(['emailId', 'userId'])
export class EmailRecipient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email_id', type: 'uuid' })
  emailId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ 
    name: 'recipient_type',
    type: 'enum', 
    enum: RecipientType 
  })
  recipientType: RecipientType;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', nullable: true })
  readAt: Date | null;

  // Relations
  @ManyToOne(() => Email, email => email.recipients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'email_id' })
  email: Email;

  @ManyToOne(() => User, user => user.receivedEmails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
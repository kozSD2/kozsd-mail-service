import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { Email } from './Email';
import { EmailRecipient } from './EmailRecipient';
import { Folder } from './Folder';
import { Attachment } from './Attachment';
import { ActivityLog } from './ActivityLog';
import { LoginAttempt } from './LoginAttempt';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ name: 'encrypted_email' })
  encryptedEmail: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'encryption_key_id', type: 'uuid' })
  encryptionKeyId: string;

  @Column({ name: 'is_edu_verified', default: false })
  isEduVerified: boolean;

  @Column({ name: 'profile_settings', type: 'jsonb', nullable: true })
  profileSettings: any;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken: string | null;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Email, email => email.sender)
  sentEmails: Email[];

  @OneToMany(() => EmailRecipient, recipient => recipient.user)
  receivedEmails: EmailRecipient[];

  @OneToMany(() => Folder, folder => folder.user)
  folders: Folder[];

  @OneToMany(() => Attachment, attachment => attachment.user)
  attachments: Attachment[];

  @OneToMany(() => ActivityLog, log => log.user)
  activityLogs: ActivityLog[];

  @OneToMany(() => LoginAttempt, attempt => attempt.user)
  loginAttempts: LoginAttempt[];
}
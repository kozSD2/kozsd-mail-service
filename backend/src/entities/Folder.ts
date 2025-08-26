import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique
} from 'typeorm';
import { User } from './User';
import { EmailFolder } from './EmailFolder';

@Entity('folders')
@Unique(['name', 'userId'])
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.folders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => EmailFolder, emailFolder => emailFolder.folder)
  emails: EmailFolder[];
}
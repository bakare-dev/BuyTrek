import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Picture } from './picture.entity';

@Entity({ name: 'userprofiles' })
export class UserProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @OneToOne(() => User, (user) => user.id)
    @JoinColumn()
    user: User;

    @OneToOne(() => Picture, (picture) => picture.id)
    @JoinColumn()
    picture: Picture;
}

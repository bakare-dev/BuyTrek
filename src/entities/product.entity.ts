import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

@Entity({ name: 'products' })
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    product: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column()
    description: string;

    @Column({ default: true })
    isAvailable: boolean;

    @ManyToOne(() => Category, (category) => category.id)
    category: Category;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.id)
    user: User;
}

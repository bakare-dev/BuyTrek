import {
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from './user.entity';
import { Max, Min } from 'class-validator';

@Entity({ name: 'productrating' })
export class ProductRating {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Product, (product) => product.id)
    product: Product;

    @ManyToOne(() => User, (user) => user.id)
    user: User;

    @Column({ type: 'int', nullable: false })
    @Min(1)
    @Max(5)
    rating: number;

    @Column({ nullable: true })
    review: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}

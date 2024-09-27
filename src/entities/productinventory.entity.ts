import {
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from './user.entity';

@Entity({ name: 'productinventory' })
export class ProductInventory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Product, (product) => product.id)
    @JoinColumn()
    product: Product;

    @Column()
    quantityInStock: number;

    @Column()
    totalQuantity: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}

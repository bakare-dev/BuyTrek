import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Address } from './address.entity';

@Entity({ name: 'orderaddresses' })
export class OrderAddress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Order, (order) => order.id, { nullable: false })
    order: Order;

    @ManyToOne(() => Address, (address) => address.id, {
        nullable: false,
    })
    address: Address;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}

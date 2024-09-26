import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Transaction } from './transaction.entity';

@Entity({ name: 'ordertransactions' })
export class OrderTransaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Order, (order) => order.id, { nullable: false })
    order: Order;

    @OneToOne(() => Transaction, (transaction) => transaction.id, {
        nullable: false,
    })
    @JoinColumn()
    transaction: Transaction;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}

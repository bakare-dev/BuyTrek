import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'orders' })
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    orderNo: string;

    @ManyToOne(() => User, (user) => user.id)
    user: User;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalAmount: number;

    @Column()
    description: string;

    @Column({
        type: 'enum',
        enum: [
            'Pending Payment Confirmation',
            'Packaging',
            'Packaged',
            'Out for Delivery',
            'Delivered',
            'Payment Completed',
            'Cancelled',
        ],
        default: 'Pending Payment Confirmation',
    })
    status:
        | 'Pending Payment Confirmation'
        | 'Packaging'
        | 'Packaged'
        | 'Out for Delivery'
        | 'Delivered'
        | 'Payment Completed'
        | 'Cancelled';

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}

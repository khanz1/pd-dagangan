import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  ForeignKey,
  NonAttribute,
  Association,
} from 'sequelize';
import { sequelize } from '@/config/database';
import { PaymentStatus } from '@/types';
import { Order } from './Order';
import { PaymentMethod } from './PaymentMethod';

export class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
  declare id: CreationOptional<number>;
  declare orderId: ForeignKey<Order['id']>;
  declare paymentMethodId: ForeignKey<PaymentMethod['id']> | null;
  declare amount: number;
  declare currency: string;
  declare status: PaymentStatus;
  declare gatewayResponse: Record<string, any> | null;
  declare paidAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare order?: NonAttribute<Order>;
  declare paymentMethod?: NonAttribute<PaymentMethod>;

  // Association declarations
  declare static associations: {
    order: Association<Payment, Order>;
    paymentMethod: Association<Payment, PaymentMethod>;
  };
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'order_id',
      references: {
        model: Order,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    paymentMethodId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'payment_method_id',
      references: {
        model: PaymentMethod,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: 'IDR',
      validate: {
        len: [3, 3],
        isUppercase: true,
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'success', 'failed']],
      },
    },
    gatewayResponse: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'gateway_response',
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['order_id'],
      },
      {
        fields: ['payment_method_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['paid_at'],
      },
    ],
  }
); 
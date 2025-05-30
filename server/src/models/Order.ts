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
import { OrderStatus } from '@/types';
import { User } from './User';
import { Coupon } from './Coupon';

export class Order extends Model<InferAttributes<Order>, InferCreationAttributes<Order>> {
  declare id: CreationOptional<number>;
  declare orderNumber: string;
  declare userId: ForeignKey<User['id']>;
  declare status: OrderStatus;
  declare subtotal: number;
  declare tax: number;
  declare shippingFee: number;
  declare total: number;
  declare couponId: ForeignKey<Coupon['id']> | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;
  declare coupon?: NonAttribute<Coupon>;
  declare items?: NonAttribute<any[]>;
  declare payment?: NonAttribute<any>;
  declare shipment?: NonAttribute<any>;

  // Association declarations
  declare static associations: {
    user: Association<Order, User>;
    coupon: Association<Order, Coupon>;
    items: Association<Order, any>;
    payment: Association<Order, any>;
    shipment: Association<Order, any>;
  };
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderNumber: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      field: 'order_number',
      validate: {
        len: [1, 30],
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('new', 'paid', 'shipped', 'delivered', 'closed'),
      allowNull: false,
      defaultValue: 'new',
      validate: {
        isIn: [['new', 'paid', 'shipped', 'delivered', 'closed']],
      },
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    shippingFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'shipping_fee',
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    couponId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'coupon_id',
      references: {
        model: Coupon,
        key: 'id',
      },
      onDelete: 'SET NULL',
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
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['order_number'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['coupon_id'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['total'],
      },
    ],
  }
); 
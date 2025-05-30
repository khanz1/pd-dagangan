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
import { ShipmentStatus } from '@/types';
import { Order } from './Order';
import { Address } from './Address';

export class Shipment extends Model<InferAttributes<Shipment>, InferCreationAttributes<Shipment>> {
  declare id: CreationOptional<number>;
  declare orderId: ForeignKey<Order['id']>;
  declare addressId: ForeignKey<Address['id']>;
  declare courier: string | null;
  declare trackingNumber: string | null;
  declare status: ShipmentStatus;
  declare shippedAt: Date | null;
  declare deliveredAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare order?: NonAttribute<Order>;
  declare address?: NonAttribute<Address>;

  // Association declarations
  declare static associations: {
    order: Association<Shipment, Order>;
    address: Association<Shipment, Address>;
  };
}

Shipment.init(
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
    addressId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'address_id',
      references: {
        model: Address,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    courier: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [1, 50],
      },
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'tracking_number',
      validate: {
        len: [0, 100],
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_transit', 'delivered', 'returned'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'in_transit', 'delivered', 'returned']],
      },
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'shipped_at',
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'delivered_at',
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
    tableName: 'shipments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['order_id'],
      },
      {
        fields: ['address_id'],
      },
      {
        fields: ['status'],
      },
    ],
  }
); 
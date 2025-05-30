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
import { Product } from './Product';

export class InventoryLog extends Model<
  InferAttributes<InventoryLog>,
  InferCreationAttributes<InventoryLog>
> {
  declare id: CreationOptional<number>;
  declare productId: ForeignKey<Product['id']>;
  declare changeAmount: number;
  declare reason: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare product?: NonAttribute<Product>;

  // Association declarations
  declare static associations: {
    product: Association<InventoryLog, Product>;
  };
}

InventoryLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
      references: {
        model: Product,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    changeAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'change_amount',
      validate: {
        isInt: true,
      },
    },
    reason: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [0, 50],
      },
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
    tableName: 'inventory_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['product_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
); 
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
import { ProductStatus } from '@/types';
import { User } from './User';
import { Category } from './Category';

export class Product extends Model<InferAttributes<Product>, InferCreationAttributes<Product>> {
  declare id: CreationOptional<number>;
  declare sellerId: ForeignKey<User['id']>;
  declare name: string;
  declare description: string | null;
  declare price: number;
  declare sku: string;
  declare stockQuantity: number;
  declare weight: number;
  declare dimensions: string | null;
  declare slug: string;
  declare status: ProductStatus;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare seller?: NonAttribute<User>;
  declare categories?: NonAttribute<Category[]>;
  declare cartItems?: NonAttribute<any[]>;
  declare orderItems?: NonAttribute<any[]>;
  declare wishlistItems?: NonAttribute<any[]>;
  declare reviews?: NonAttribute<any[]>;
  declare inventoryLogs?: NonAttribute<any[]>;

  // Association declarations
  declare static associations: {
    seller: Association<Product, User>;
    categories: Association<Product, Category>;
    cartItems: Association<Product, any>;
    orderItems: Association<Product, any>;
    wishlistItems: Association<Product, any>;
    reviews: Association<Product, any>;
    inventoryLogs: Association<Product, any>;
  };
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'seller_id',
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50],
      },
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'stock_quantity',
      validate: {
        min: 0,
        isInt: true,
      },
    },
    weight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    dimensions: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 100],
        is: /^[a-z0-9-]+$/i, // Basic slug validation
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'archived'),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'archived']],
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
    tableName: 'products',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['sku'],
      },
      {
        unique: true,
        fields: ['slug'],
      },
      {
        fields: ['seller_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['price'],
      },
      {
        fields: ['stock_quantity'],
      },
      {
        fields: ['name'],
        type: 'FULLTEXT',
      },
    ],
  }
); 
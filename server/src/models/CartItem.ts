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
import { Cart } from './Cart';
import { Product } from './Product';

export class CartItem extends Model<InferAttributes<CartItem>, InferCreationAttributes<CartItem>> {
  declare id: CreationOptional<number>;
  declare cartId: ForeignKey<Cart['id']>;
  declare productId: ForeignKey<Product['id']>;
  declare quantity: number;
  declare selectedOptions: Record<string, any> | null;
  declare unitPriceAtAdd: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare cart?: NonAttribute<Cart>;
  declare product?: NonAttribute<Product>;

  // Association declarations
  declare static associations: {
    cart: Association<CartItem, Cart>;
    product: Association<CartItem, Product>;
  };
}

CartItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cartId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'cart_id',
      references: {
        model: Cart,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
      references: {
        model: Product,
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        isInt: true,
      },
    },
    selectedOptions: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'selected_options',
    },
    unitPriceAtAdd: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'unit_price_at_add',
      validate: {
        min: 0,
        isDecimal: true,
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
    tableName: 'cart_items',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['cart_id'],
      },
      {
        fields: ['product_id'],
      },
      {
        unique: true,
        fields: ['cart_id', 'product_id'],
        name: 'cart_items_cart_product_unique',
      },
    ],
  }
); 
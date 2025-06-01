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
import { Wishlist } from './Wishlist';
import { Product } from './Product';

export class WishlistItem extends Model<
  InferAttributes<WishlistItem>,
  InferCreationAttributes<WishlistItem>
> {
  declare id: CreationOptional<number>;
  declare wishlistId: ForeignKey<Wishlist['id']>;
  declare productId: ForeignKey<Product['id']>;
  declare addedAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare wishlist?: NonAttribute<Wishlist>;
  declare product?: NonAttribute<Product>;

  // Association declarations
  declare static associations: {
    wishlist: Association<WishlistItem, Wishlist>;
    product: Association<WishlistItem, Product>;
  };
}

WishlistItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    wishlistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'wishlist_id',
      references: {
        model: Wishlist,
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
      onDelete: 'CASCADE',
    },
    addedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'added_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'added_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'wishlist_items',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['wishlist_id'],
      },
      {
        fields: ['product_id'],
      },
      {
        unique: true,
        fields: ['wishlist_id', 'product_id'],
        name: 'wishlist_items_unique',
      },
    ],
  }
);

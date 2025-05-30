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
import { Category } from './Category';

export class ProductCategory extends Model<
  InferAttributes<ProductCategory>,
  InferCreationAttributes<ProductCategory>
> {
  declare productId: ForeignKey<Product['id']>;
  declare categoryId: ForeignKey<Category['id']>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare product?: NonAttribute<Product>;
  declare category?: NonAttribute<Category>;

  // Association declarations
  declare static associations: {
    product: Association<ProductCategory, Product>;
    category: Association<ProductCategory, Category>;
  };
}

ProductCategory.init(
  {
    productId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: 'product_id',
      references: {
        model: Product,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    categoryId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: 'category_id',
      references: {
        model: Category,
        key: 'id',
      },
      onDelete: 'CASCADE',
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
    tableName: 'product_categories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['product_id'],
      },
      {
        fields: ['category_id'],
      },
      {
        unique: true,
        fields: ['product_id', 'category_id'],
        name: 'product_categories_unique',
      },
    ],
  }
); 
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
import { User } from './User';

export class Wishlist extends Model<InferAttributes<Wishlist>, InferCreationAttributes<Wishlist>> {
  declare id: CreationOptional<number>;
  declare userId: ForeignKey<User['id']>;
  declare name: string;
  declare isDefault: CreationOptional<boolean>;
  declare isPublic: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;
  declare items?: NonAttribute<any[]>;

  // Association declarations
  declare static associations: {
    user: Association<Wishlist, User>;
    items: Association<Wishlist, any>;
  };
}

Wishlist.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'My Wishlist',
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default',
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_public',
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
    tableName: 'wishlists',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'name'],
        unique: true,
      },
      {
        fields: ['user_id', 'is_default'],
      },
    ],
  }
);

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

export class SellerProfile extends Model<
  InferAttributes<SellerProfile>,
  InferCreationAttributes<SellerProfile>
> {
  declare userId: ForeignKey<User['id']>;
  declare balance: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;

  // Association declarations
  declare static associations: {
    user: Association<SellerProfile, User>;
  };
}

SellerProfile.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: 'user_id',
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    balance: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'seller_profiles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
    ],
  }
); 
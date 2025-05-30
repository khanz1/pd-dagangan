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
import { PaymentMethodType } from '@/types';
import { User } from './User';

export class PaymentMethod extends Model<
  InferAttributes<PaymentMethod>,
  InferCreationAttributes<PaymentMethod>
> {
  declare id: CreationOptional<number>;
  declare userId: ForeignKey<User['id']>;
  declare type: PaymentMethodType;
  declare provider: string | null;
  declare maskedAccount: string | null;
  declare expiresAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;
  declare payments?: NonAttribute<any[]>;

  // Association declarations
  declare static associations: {
    user: Association<PaymentMethod, User>;
    payments: Association<PaymentMethod, any>;
  };
}

PaymentMethod.init(
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
    type: {
      type: DataTypes.ENUM('card', 'wallet', 'bank'),
      allowNull: false,
      validate: {
        isIn: [['card', 'wallet', 'bank']],
      },
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    maskedAccount: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'masked_account',
    },
    expiresAt: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'expires_at',
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
    tableName: 'payment_methods',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['type'],
      },
    ],
  }
); 
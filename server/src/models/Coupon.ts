import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Association,
} from 'sequelize';
import { sequelize } from '@/config/database';
import { CouponType, CouponStatus } from '@/types';

export class Coupon extends Model<InferAttributes<Coupon>, InferCreationAttributes<Coupon>> {
  declare id: CreationOptional<number>;
  declare code: string;
  declare type: CouponType;
  declare value: number;
  declare minOrderAmount: number;
  declare maxUses: number;
  declare perUserLimit: number;
  declare startAt: Date;
  declare expiresAt: Date | null;
  declare status: CouponStatus;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare orders?: NonAttribute<any[]>;

  // Association declarations
  declare static associations: {
    orders: Association<Coupon, any>;
  };
}

Coupon.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50],
        isUppercase: true,
        is: /^[A-Z0-9_-]+$/,
      },
    },
    type: {
      type: DataTypes.ENUM('percent', 'fixed'),
      allowNull: false,
      validate: {
        isIn: [['percent', 'fixed']],
      },
    },
    value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
        customValidation(value: number) {
          if (this['type'] === 'percent' && value > 100) {
            throw new Error('Percentage discount cannot exceed 100%');
          }
        },
      },
    },
    minOrderAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'min_order_amount',
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    maxUses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'max_uses',
      validate: {
        min: 0,
        isInt: true,
      },
    },
    perUserLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'per_user_limit',
      validate: {
        min: 1,
        isInt: true,
      },
    },
    startAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_at',
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
      validate: {
        isAfterStartDate(value: Date | null) {
          if (value && this['startAt'] && value <= this['startAt']) {
            throw new Error('Expiry date must be after start date');
          }
        },
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'disabled'),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'expired', 'disabled']],
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
    tableName: 'coupons',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['code'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['expires_at'],
      },
    ],
  }
); 
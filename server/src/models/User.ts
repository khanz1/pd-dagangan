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
import { UserRole, UserStatus } from '@/types';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare passwordHash: string;
  declare role: UserRole;
  declare firstName: string;
  declare lastName: string | null;
  declare phone: string | null;
  declare status: UserStatus;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations (will be populated by associations)
  declare sellerProfile?: NonAttribute<any>;
  declare addresses?: NonAttribute<any[]>;
  declare products?: NonAttribute<any[]>;
  declare cart?: NonAttribute<any>;
  declare orders?: NonAttribute<any[]>;
  declare paymentMethods?: NonAttribute<any[]>;
  declare wishlist?: NonAttribute<any>;
  declare reviews?: NonAttribute<any[]>;
  declare notifications?: NonAttribute<any[]>;

  // Association declarations
  declare static associations: {
    sellerProfile: Association<User, any>;
    addresses: Association<User, any>;
    products: Association<User, any>;
    cart: Association<User, any>;
    orders: Association<User, any>;
    paymentMethods: Association<User, any>;
    wishlist: Association<User, any>;
    reviews: Association<User, any>;
    notifications: Association<User, any>;
  };
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        len: [1, 255],
      },
    },
    passwordHash: {
      type: DataTypes.CHAR(60),
      allowNull: false,
      field: 'password_hash',
    },
    role: {
      type: DataTypes.ENUM('buyer', 'seller', 'admin'),
      allowNull: false,
      validate: {
        isIn: [['buyer', 'seller', 'admin']],
      },
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'first_name',
      validate: {
        len: [1, 50],
      },
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'last_name',
      validate: {
        len: [0, 50],
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: [0, 20],
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'blocked'),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'blocked']],
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['role'],
      },
      {
        fields: ['status'],
      },
    ],
  }
); 
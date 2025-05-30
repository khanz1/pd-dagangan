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
import { MediaType } from '@/types';
import { Review } from './Review';

export class ReviewMedia extends Model<
  InferAttributes<ReviewMedia>,
  InferCreationAttributes<ReviewMedia>
> {
  declare id: CreationOptional<number>;
  declare reviewId: ForeignKey<Review['id']>;
  declare mediaType: MediaType;
  declare url: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare review?: NonAttribute<Review>;

  // Association declarations
  declare static associations: {
    review: Association<ReviewMedia, Review>;
  };
}

ReviewMedia.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    reviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'review_id',
      references: {
        model: Review,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    mediaType: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
      field: 'media_type',
      validate: {
        isIn: [['image', 'video']],
      },
    },
    url: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255],
        isUrl: true,
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
    tableName: 'review_media',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['review_id'],
      },
      {
        fields: ['media_type'],
      },
    ],
  }
); 
import { Transaction, Model, ModelStatic, FindOptions, WhereOptions, CreateOptions, UpdateOptions, DestroyOptions } from 'sequelize';
import { logger } from '@/config/logger';

export interface RepositoryOptions {
  transaction?: Transaction;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResult<T> {
  rows: T[];
  count: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export abstract class BaseRepository<T extends Model> {
  protected model: ModelStatic<T>;
  protected modelName: string;

  constructor(model: ModelStatic<T>) {
    this.model = model;
    this.modelName = model.name;
  }

  /**
   * Find a record by primary key
   */
  async findByPk(id: number | string, options?: FindOptions & RepositoryOptions): Promise<T | null> {
    try {
      const result = await this.model.findByPk(id, this.buildFindOptions(options));
      logger.debug(`${this.modelName}.findByPk(${id})`, { found: !!result });
      return result;
    } catch (error) {
      logger.error(`${this.modelName}.findByPk(${id}) failed:`, error);
      throw error;
    }
  }

  /**
   * Find one record matching the criteria
   */
  async findOne(options?: FindOptions & RepositoryOptions): Promise<T | null> {
    try {
      const result = await this.model.findOne(this.buildFindOptions(options));
      logger.debug(`${this.modelName}.findOne`, { found: !!result });
      return result;
    } catch (error) {
      logger.error(`${this.modelName}.findOne failed:`, error);
      throw error;
    }
  }

  /**
   * Find all records matching the criteria
   */
  async findAll(options?: FindOptions & RepositoryOptions): Promise<T[]> {
    try {
      const results = await this.model.findAll(this.buildFindOptions(options));
      logger.debug(`${this.modelName}.findAll`, { count: results.length });
      return results;
    } catch (error) {
      logger.error(`${this.modelName}.findAll failed:`, error);
      throw error;
    }
  }

  /**
   * Find and count records with pagination
   */
  async findAndCountAll(options?: FindOptions & RepositoryOptions & PaginationOptions): Promise<PaginationResult<T>> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const offset = options?.offset || (page - 1) * limit;

      const { rows, count } = await this.model.findAndCountAll({
        ...this.buildFindOptions(options),
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      logger.debug(`${this.modelName}.findAndCountAll`, { 
        count, 
        page, 
        totalPages,
        itemsPerPage: limit
      });

      return {
        rows,
        count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      };
    } catch (error) {
      logger.error(`${this.modelName}.findAndCountAll failed:`, error);
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async create(data: any, options?: CreateOptions & RepositoryOptions): Promise<T> {
    try {
      const result = await this.model.create(data, this.buildCreateOptions(options));
      logger.info(`${this.modelName}.create`, { id: result.get('id') });
      return result;
    } catch (error) {
      logger.error(`${this.modelName}.create failed:`, error);
      throw error;
    }
  }

  /**
   * Update records matching the criteria
   */
  async update(
    data: any, 
    options: { where: WhereOptions } & UpdateOptions & RepositoryOptions
  ): Promise<[number]> {
    try {
      const result = await this.model.update(data, this.buildUpdateOptions(options));
      logger.info(`${this.modelName}.update`, { affectedRows: result[0] });
      return result;
    } catch (error) {
      logger.error(`${this.modelName}.update failed:`, error);
      throw error;
    }
  }

  /**
   * Delete records matching the criteria
   */
  async destroy(options: { where: WhereOptions } & DestroyOptions & RepositoryOptions): Promise<number> {
    try {
      const result = await this.model.destroy(this.buildDestroyOptions(options));
      logger.info(`${this.modelName}.destroy`, { deletedRows: result });
      return result;
    } catch (error) {
      logger.error(`${this.modelName}.destroy failed:`, error);
      throw error;
    }
  }

  /**
   * Count records matching the criteria
   */
  async count(options?: { where?: WhereOptions } & RepositoryOptions): Promise<number> {
    try {
      const result = await this.model.count(this.buildCountOptions(options));
      logger.debug(`${this.modelName}.count`, { count: result });
      return result;
    } catch (error) {
      logger.error(`${this.modelName}.count failed:`, error);
      throw error;
    }
  }

  /**
   * Check if a record exists
   */
  async exists(where: WhereOptions, options?: RepositoryOptions): Promise<boolean> {
    try {
      const count = await this.count({ where, ...options });
      return count > 0;
    } catch (error) {
      logger.error(`${this.modelName}.exists failed:`, error);
      throw error;
    }
  }

  /**
   * Build FindOptions with transaction support
   */
  protected buildFindOptions(options?: FindOptions & RepositoryOptions): FindOptions {
    const { transaction, ...findOptions } = options || {};
    return {
      ...findOptions,
      ...(transaction && { transaction })
    };
  }

  /**
   * Build CreateOptions with transaction support
   */
  protected buildCreateOptions(options?: CreateOptions & RepositoryOptions): CreateOptions {
    const { transaction, ...createOptions } = options || {};
    return {
      ...createOptions,
      ...(transaction && { transaction })
    };
  }

  /**
   * Build UpdateOptions with transaction support
   */
  protected buildUpdateOptions(options: { where: WhereOptions } & UpdateOptions & RepositoryOptions): UpdateOptions {
    const { transaction, where, ...updateOptions } = options;
    return {
      where,
      ...updateOptions,
      ...(transaction && { transaction })
    };
  }

  /**
   * Build DestroyOptions with transaction support
   */
  protected buildDestroyOptions(options?: DestroyOptions & RepositoryOptions): DestroyOptions {
    const { transaction, ...destroyOptions } = options || {};
    return {
      ...destroyOptions,
      ...(transaction && { transaction })
    };
  }

  /**
   * Build count options with transaction support
   */
  protected buildCountOptions(options?: { where?: WhereOptions } & RepositoryOptions) {
    const { transaction, ...countOptions } = options || {};
    return {
      ...countOptions,
      ...(transaction && { transaction })
    };
  }
} 
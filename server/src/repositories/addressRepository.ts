import {
  BaseRepository,
  RepositoryOptions,
  PaginationOptions,
  PaginationResult,
} from './baseRepository';
import { Address, User } from '../models';
import { AddressType } from '../types';

export interface CreateAddressData {
  userId: number;
  type: AddressType;
  street1: string;
  street2?: string;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
}

export interface UpdateAddressData {
  type?: AddressType;
  street1?: string;
  street2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface AddressFilters {
  userId?: number;
  type?: AddressType;
  city?: string;
  province?: string;
  country?: string;
}

export class AddressRepository extends BaseRepository<Address> {
  constructor() {
    super(Address);
  }

  /**
   * Find addresses by user ID
   */
  async findByUserId(userId: number, options?: RepositoryOptions): Promise<Address[]> {
    return this.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      ...options,
    });
  }

  /**
   * Find addresses by user ID and type
   */
  async findByUserIdAndType(
    userId: number,
    type: AddressType,
    options?: RepositoryOptions
  ): Promise<Address[]> {
    return this.findAll({
      where: { userId, type },
      order: [['createdAt', 'DESC']],
      ...options,
    });
  }

  /**
   * Find default shipping address for user
   */
  async findDefaultShippingAddress(
    userId: number,
    options?: RepositoryOptions
  ): Promise<Address | null> {
    // For now, return the most recent shipping address
    // Later can add a 'isDefault' field to the model
    return this.findOne({
      where: { userId, type: 'shipping' },
      order: [['createdAt', 'DESC']],
      ...options,
    });
  }

  /**
   * Find default billing address for user
   */
  async findDefaultBillingAddress(
    userId: number,
    options?: RepositoryOptions
  ): Promise<Address | null> {
    return this.findOne({
      where: { userId, type: 'billing' },
      order: [['createdAt', 'DESC']],
      ...options,
    });
  }

  /**
   * Create address
   */
  async createAddress(
    addressData: CreateAddressData,
    options?: RepositoryOptions
  ): Promise<Address> {
    return this.create(addressData, options);
  }

  /**
   * Update address
   */
  async updateAddress(
    addressId: number,
    updateData: UpdateAddressData,
    options?: RepositoryOptions
  ): Promise<Address | null> {
    const [affectedCount] = await this.update(updateData, {
      where: { id: addressId },
      ...options,
    });

    if (affectedCount === 0) {
      return null;
    }

    return this.findByPk(addressId, options);
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId: number, options?: RepositoryOptions): Promise<boolean> {
    const affectedCount = await this.destroy({
      where: { id: addressId },
      ...options,
    });

    return affectedCount > 0;
  }

  /**
   * Check if user owns address
   */
  async isOwnedByUser(
    addressId: number,
    userId: number,
    options?: RepositoryOptions
  ): Promise<boolean> {
    const address = await this.findOne({
      where: { id: addressId, userId },
      ...options,
    });

    return address !== null;
  }

  /**
   * Find addresses with filters
   */
  async findWithFilters(
    filters: AddressFilters,
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<Address>> {
    const whereClause: any = {};

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.type) {
      whereClause.type = filters.type;
    }

    if (filters.city) {
      whereClause.city = filters.city;
    }

    if (filters.province) {
      whereClause.province = filters.province;
    }

    if (filters.country) {
      whereClause.country = filters.country;
    }

    return this.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options,
    });
  }

  /**
   * Validate address for shipping
   */
  async validateShippingAddress(
    addressId: number,
    options?: RepositoryOptions
  ): Promise<{ valid: boolean; errors: string[] }> {
    const address = await this.findByPk(addressId, options);

    if (!address) {
      return { valid: false, errors: ['Address not found'] };
    }

    const errors: string[] = [];

    if (!address.street1 || address.street1.trim().length === 0) {
      errors.push('Street address is required');
    }

    if (!address.city || address.city.trim().length === 0) {
      errors.push('City is required');
    }

    if (!address.province || address.province.trim().length === 0) {
      errors.push('Province is required for shipping');
    }

    if (!address.postalCode || address.postalCode.trim().length === 0) {
      errors.push('Postal code is required for shipping');
    }

    if (!address.country || address.country.trim().length === 0) {
      errors.push('Country is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

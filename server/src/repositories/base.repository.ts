import { Model, FilterQuery, UpdateQuery } from 'mongoose';

export class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filter).lean<T[]>().exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).lean<T>().exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).lean<T>().exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const document = await this.model.create(data);
    return document.toObject() as T;
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, data, { new: true })
      .lean<T>()
      .exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).lean<T>().exec();
  }
}

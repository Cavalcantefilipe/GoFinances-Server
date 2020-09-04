import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import {
  getRepository,
  QueryBuilder,
  Repository,
  getConnection,
  getCustomRepository,
} from 'typeorm';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const TransactionsRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = await getRepository(Category);

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category,
      });
    }
    await categoryRepository.save(transactionCategory);

    const { total } = await TransactionsRepository.getBalance();

    if (type == 'outcome') {
      if (total - value < 0) {
        throw new AppError(`You don't have this value`, 400);
      }
    }

    const transaction = TransactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await TransactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

import { getDb } from '../db/connect.js';

const bookProjection = { _id: 0, id: 1, authorId: 1, title: 1, publicationDate: 1 };

const getAllBooks = async ({ authorId, limit, skip }) => {
  const collection = getDb().collection('books');
  const filter = authorId ? { authorId } : {};
  return collection
    .find(filter, { projection: bookProjection })
    .sort({ id: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();
};

const getBookById = async (bookId) => {
  const collection = getDb().collection('books');
  return collection.findOne({ id: bookId }, { projection: bookProjection });
};

const createBook = async (book) => {
  const collection = getDb().collection('books');
  await collection.insertOne(book);
  return getBookById(book.id);
};

const updateBook = async (id, book) => {
  const collection = getDb().collection('books');
  const result = await collection.updateOne({ id }, { $set: book });
  if (result.matchedCount === 0) {
    return null;
  }

  return getBookById(id);
};

const deleteBook = async (id) => {
  const collection = getDb().collection('books');
  const result = await collection.deleteOne({ id });
  return result.deletedCount === 1;
};

const authorExists = async (authorId) => {
  const collection = getDb().collection('authors');
  return Boolean(await collection.findOne({ id: authorId }, { projection: { _id: 1 } }));
};

export {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  authorExists,
};

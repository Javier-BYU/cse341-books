import { getDb } from '../db/connect.js';

const bookProjection = { _id: 0, id: 1, authorId: 1, title: 1, publicationDate: 1 };

const getAllBooks = async () => {
  const db = getDb();
  const collection = db.collection('books');
  const books = await collection.find({}, { projection: bookProjection }).toArray();
  return books;
};

const getBookById = async (bookId) => {
  const db = getDb();
  const collection = db.collection('books');
  const book = await collection.findOne({ id: bookId }, { projection: bookProjection });
  return book;
};

export { getAllBooks, getBookById };